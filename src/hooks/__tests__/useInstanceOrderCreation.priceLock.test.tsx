import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useInstanceOrderCreation,
  summarizePricingBreakdownTotals,
} from "../useInstanceOrderCreation";
import type { Configuration } from "../../types/InstanceConfiguration";

/*
 * Producer-side guarantee for the price lock (root CLAUDE.md convention):
 * POST /instances/create is the quote — the payment step renders the
 * returned breakdown. When the exact same order is re-submitted, the hook
 * must send the reviewed figures as `expected_subtotal` / `expected_total`
 * so InitiateMultiInstancesAction can 409 on drift. Any price-affecting
 * change (configurations, protection plan) must disarm the lock instead
 * of producing a false 409.
 */

vi.mock("../useApiContext", () => ({
  useApiContext: () => ({
    context: "client",
    apiBaseUrl: "http://api.test",
    authHeaders: { "Content-Type": "application/json" },
  }),
}));

vi.mock("@/utils/toastUtil", () => ({
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const baseConfig = {
  id: "cfg-1",
  name: "pl-vm",
  region: "uni-ng",
  project_mode: "new",
  project_name: "Lock Project",
  network_preset: "standard",
  compute_instance_id: "42",
  os_image_id: "7",
  volume_type_id: "3",
  storage_size_gb: 50,
  months: 1,
  instance_count: 1,
  keypair_name: "ops-key",
} as unknown as Configuration;

type HookProps = {
  configurations: Configuration[];
  protectionPlan?: { plan: string; monthlyCost?: number };
};

const renderOrderHook = (initialProps: HookProps) =>
  renderHook(
    (props: HookProps) =>
      useInstanceOrderCreation({
        configurations: props.configurations,
        isFastTrack: false,
        billingCountry: "NG",
        contextType: "",
        selectedTenantId: "",
        selectedUserId: "",
        setActiveStep: vi.fn(),
        protectionPlan: props.protectionPlan,
        paymentStepIndex: 3,
        reviewStepIndex: 4,
      }),
    { initialProps }
  );

const orderResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({
    data: {
      pricing_breakdown: [{ subtotal: 1000, tax: 75, total: 1075, currency: "NGN" }],
      transaction: { identifier: "TX-1", metadata: {} },
      payment: { required: true, payment_gateway_options: [] },
    },
  }),
});

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const requestBody = (callIndex: number): Record<string, unknown> =>
  JSON.parse((fetchMock.mock.calls[callIndex][1] as { body: string }).body);

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => orderResponse());
});

describe("useInstanceOrderCreation price lock", () => {
  it("sends no lock on first submit, then the reviewed figures on an identical re-submit", async () => {
    const { result } = renderOrderHook({ configurations: [baseConfig] });

    await act(async () => {
      await result.current.handleCreateOrder();
    });
    expect(requestBody(0).expected_subtotal).toBeUndefined();
    expect(requestBody(0).expected_total).toBeUndefined();

    await act(async () => {
      await result.current.handleCreateOrder();
    });
    expect(requestBody(1).expected_subtotal).toBe(1000);
    expect(requestBody(1).expected_total).toBe(1075);
  });

  it("disarms the lock when the protection plan changed between submissions", async () => {
    const { result, rerender } = renderOrderHook({ configurations: [baseConfig] });

    await act(async () => {
      await result.current.handleCreateOrder();
    });

    rerender({
      configurations: [baseConfig],
      protectionPlan: { plan: "backup_only", monthlyCost: 240 },
    });

    await act(async () => {
      await result.current.handleCreateOrder();
    });
    expect(requestBody(1).expected_subtotal).toBeUndefined();
    expect(requestBody(1).expected_total).toBeUndefined();
  });

  it("disarms the lock when the configuration changed between submissions", async () => {
    const { result, rerender } = renderOrderHook({ configurations: [baseConfig] });

    await act(async () => {
      await result.current.handleCreateOrder();
    });

    rerender({ configurations: [{ ...baseConfig, storage_size_gb: 100 } as Configuration] });

    await act(async () => {
      await result.current.handleCreateOrder();
    });
    expect(requestBody(1).expected_subtotal).toBeUndefined();
  });

  it("consumes the lock on a failed re-submit so the next attempt re-quotes fresh", async () => {
    const { result } = renderOrderHook({ configurations: [baseConfig] });

    await act(async () => {
      await result.current.handleCreateOrder();
    });

    // Re-submit trips the backend guard (price drifted server-side).
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ message: "Price quote has changed since you last reviewed it." }),
    });
    await act(async () => {
      await result.current.handleCreateOrder();
    });
    expect(requestBody(1).expected_subtotal).toBe(1000);

    // The user was shown the new figures in the 409 toast; the retry must
    // re-quote fresh instead of looping on the stale lock.
    await act(async () => {
      await result.current.handleCreateOrder();
    });
    expect(requestBody(2).expected_subtotal).toBeUndefined();
  });
});

describe("summarizePricingBreakdownTotals", () => {
  it("sums subtotal and total across breakdown entries and rounds to 2dp", () => {
    expect(
      summarizePricingBreakdownTotals([
        { subtotal: 1000.005, tax: 75, total: 1075.005 },
        { subtotal: 240, tax: 0, total: 240 },
      ])
    ).toEqual({ subtotal: 1240.01, total: 1315.01 });
  });

  it("returns zeros for a missing or malformed breakdown", () => {
    expect(summarizePricingBreakdownTotals(null)).toEqual({ subtotal: 0, total: 0 });
    expect(summarizePricingBreakdownTotals({ subtotal: 5 })).toEqual({ subtotal: 0, total: 0 });
    expect(summarizePricingBreakdownTotals([{ note: "no numbers" }])).toEqual({
      subtotal: 0,
      total: 0,
    });
  });
});
