import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useInstanceOrderCreation,
  summarizePricingBreakdownTotals,
} from "../useInstanceOrderCreation";
import { PREVIEW_PRICING_DEBOUNCE_MS } from "../../utils/instancePreviewPricing";
import type { Configuration } from "../../types/InstanceConfiguration";

/*
 * Producer-side guarantee for the price lock (root CLAUDE.md convention):
 * `expected_total` is REQUIRED by POST /instances/create, so on the FIRST
 * submit the hook sources it from the displayed preview estimate
 * (POST /instances/preview-pricing). On an identical re-submit it prefers
 * the reviewed breakdown returned by the previous create (subtotal + total)
 * so InitiateMultiInstancesAction can 409 on drift. Any price-affecting
 * change (configurations, protection plan) must disarm the reviewed lock
 * (falling back to the fresh estimate) instead of producing a false 409.
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

const previewResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({ data: { grand_total: 1075, currency: "NGN" } }),
});

const isPreviewCall = (url: unknown) => String(url).includes("preview-pricing");

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

// Only the create calls carry expected_* — filter out the preview probes.
const createCalls = () =>
  fetchMock.mock.calls.filter(([url]) => !isPreviewCall(url));

const requestBody = (createCallIndex: number): Record<string, unknown> =>
  JSON.parse((createCalls()[createCallIndex][1] as { body: string }).body);

// Drive the debounced preview effect so `priceEstimate` is populated before
// the first submit (which now requires expected_total).
const settlePreview = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(PREVIEW_PRICING_DEBOUNCE_MS + 50);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: unknown) =>
    isPreviewCall(url) ? previewResponse() : orderResponse()
  );
});

afterEach(() => {
  vi.useRealTimers();
});

const submit = async (result: { current: { handleCreateOrder: () => Promise<unknown> } }) => {
  await act(async () => {
    const pending = result.current.handleCreateOrder();
    await vi.advanceTimersByTimeAsync(1000);
    await pending;
  });
};

describe("useInstanceOrderCreation price lock", () => {
  it("sends the estimate total on first submit, then the reviewed figures on an identical re-submit", async () => {
    const { result } = renderOrderHook({ configurations: [baseConfig] });
    await settlePreview();

    await submit(result);
    // First submit: no reviewed breakdown yet, so expected_total comes from
    // the displayed preview estimate (subtotal lock stays absent).
    expect(requestBody(0).expected_subtotal).toBeUndefined();
    expect(requestBody(0).expected_total).toBe(1075);

    await submit(result);
    // Re-submit: the reviewed breakdown from the first create supplies both.
    expect(requestBody(1).expected_subtotal).toBe(1000);
    expect(requestBody(1).expected_total).toBe(1075);
  });

  it("disarms the reviewed subtotal lock when the protection plan changed, still sending the estimate total", async () => {
    const { result, rerender } = renderOrderHook({ configurations: [baseConfig] });
    await settlePreview();

    await submit(result);

    rerender({
      configurations: [baseConfig],
      protectionPlan: { plan: "backup_only", monthlyCost: 240 },
    });
    await settlePreview();

    await submit(result);
    // The reviewed lock is disarmed (protection changed), but expected_total
    // is REQUIRED — it falls back to the fresh estimate (compute 1075 + the
    // protection fee 240 × 1 month = 1315).
    expect(requestBody(1).expected_subtotal).toBeUndefined();
    expect(requestBody(1).expected_total).toBe(1315);
  });

  it("disarms the reviewed subtotal lock when the configuration changed", async () => {
    const { result, rerender } = renderOrderHook({ configurations: [baseConfig] });
    await settlePreview();

    await submit(result);

    rerender({ configurations: [{ ...baseConfig, storage_size_gb: 100 } as Configuration] });
    await settlePreview();

    await submit(result);
    expect(requestBody(1).expected_subtotal).toBeUndefined();
    expect(requestBody(1).expected_total).toBe(1075);
  });

  it("consumes the reviewed lock on a failed re-submit so the next attempt re-quotes from the estimate", async () => {
    const { result } = renderOrderHook({ configurations: [baseConfig] });
    await settlePreview();

    await submit(result);

    // Re-submit trips the backend guard (price drifted server-side).
    fetchMock.mockImplementationOnce(async (url: unknown) =>
      isPreviewCall(url)
        ? previewResponse()
        : {
            ok: false,
            status: 409,
            json: async () => ({ message: "Price quote has changed since you last reviewed it." }),
          }
    );
    await submit(result);
    expect(requestBody(1).expected_subtotal).toBe(1000);

    // The reviewed lock is consumed; the retry re-quotes from the displayed
    // estimate rather than looping on the stale reviewed figures.
    await submit(result);
    expect(requestBody(2).expected_subtotal).toBeUndefined();
    expect(requestBody(2).expected_total).toBe(1075);
  });

  it("blocks the submit when no estimate and no reviewed lock are available", async () => {
    // Preview offline → no displayed estimate. `expected_total` is REQUIRED,
    // so the hook must block rather than 422 at the backend.
    fetchMock.mockImplementation(async (url: unknown) =>
      isPreviewCall(url)
        ? { ok: false, status: 500, json: async () => ({ message: "pricing offline" }) }
        : orderResponse()
    );
    const { result } = renderOrderHook({ configurations: [baseConfig] });
    await settlePreview();

    await submit(result);

    expect(createCalls()).toHaveLength(0);
    expect(result.current.submissionErrorMessage).toMatch(/couldn't confirm the order total/i);
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
