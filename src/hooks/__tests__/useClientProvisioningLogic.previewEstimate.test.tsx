import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useClientProvisioningLogic } from "../useClientProvisioningLogic";
import { PREVIEW_PRICING_DEBOUNCE_MS } from "../../utils/instancePreviewPricing";
import type { Configuration } from "../../types/InstanceConfiguration";

/*
 * Pre-order pricing estimate (client wizard): while configuring, the hook
 * quotes the order via POST /business/instances/preview-pricing and
 * surfaces it as pricingSummary.{grandTotal,isEstimate} — customers see a
 * price BEFORE the order exists. At submit, the reviewed estimate rides on
 * the create payload as expected_total so the backend can 409 on drift
 * (root CLAUDE.md price-lock convention).
 */

const { mockClientApi, mockSilentClientApi } = vi.hoisted(() => ({
  mockClientApi: vi.fn(),
  mockSilentClientApi: vi.fn(),
}));

vi.mock("../../index/client/api", () => ({ default: mockClientApi }));
vi.mock("../../index/client/silent", () => ({ default: mockSilentClientApi }));
vi.mock("@/stores/authStore", () => ({
  default: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ isAuthenticated: true, user: { id: 1, tenant_id: "tenant-7" } }),
}));
vi.mock("../resource", () => ({
  useFetchCountries: () => ({ data: [], isLoading: false }),
  useFetchGeneralRegions: () => ({ data: [], isFetching: false }),
}));
vi.mock("@/utils/toastUtil", () => ({
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const completeConfigPatch: Partial<Configuration> = {
  name: "vm-1",
  region: "uni-ng",
  availability_zone: "uni-ng-az-1",
  project_mode: "new",
  project_name: "Demo",
  network_preset: "standard",
  compute_instance_id: "42",
  os_image_id: "7",
  volume_type_id: "3",
  storage_size_gb: 100,
  months: 6,
  instance_count: 2,
  keypair_name: "ops-key",
};

const previewResponse = { data: { grand_total: 15750.25, currency: "NGN" } };

// useAsyncAction enforces a minimum pending window via setTimeout, so the
// fake-timer clock must advance while the order promise is in flight.
const runWithTimers = async (action: () => Promise<unknown>) => {
  await act(async () => {
    const pending = action();
    await vi.advanceTimersByTimeAsync(1000);
    await pending;
  });
};

const setupCompleteConfiguration = async () => {
  const rendered = renderHook(() => useClientProvisioningLogic());
  act(() => {
    rendered.result.current.setBillingCountry("NG");
  });
  act(() => {
    const cfgId = rendered.result.current.configurations[0]!.id;
    rendered.result.current.updateConfiguration(cfgId, completeConfigPatch);
  });
  return rendered;
};

describe("useClientProvisioningLogic pre-order pricing estimate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockClientApi.mockReset();
    mockSilentClientApi.mockReset();
    // The hook also fetches /product-pricing through the same silent
    // client; answer everything that's not the preview endpoint blandly.
    mockSilentClientApi.mockImplementation(async (_method: string, path: string) =>
      path.includes("preview-pricing") ? previewResponse : { data: null }
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces a preview-pricing call and exposes the estimate via pricingSummary", async () => {
    const { result } = await setupCompleteConfiguration();

    // Nothing fires before the debounce window closes.
    expect(
      mockSilentClientApi.mock.calls.filter(([, path]) => String(path).includes("preview-pricing"))
    ).toHaveLength(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PREVIEW_PRICING_DEBOUNCE_MS + 50);
    });

    const previewCalls = mockSilentClientApi.mock.calls.filter(([, path]) =>
      String(path).includes("preview-pricing")
    );
    expect(previewCalls).toHaveLength(1);
    const [method, path, payload] = previewCalls[0]! as [string, string, Record<string, unknown>];
    expect(method).toBe("POST");
    expect(path).toBe("/business/instances/preview-pricing");
    // The actor's own tenant must ride along — the create endpoint prices
    // with tenant overrides; the preview only does when told.
    expect(payload.tenant_id).toBe("tenant-7");
    expect(payload.country_iso).toBe("NG");
    const request = (payload.pricing_requests as Record<string, unknown>[])[0]!;
    expect(request.availability_zone).toBe("uni-ng-az-1");

    expect(result.current.pricingSummary).toMatchObject({
      grandTotal: 15750.25,
      currency: "NGN",
      isEstimate: true,
    });
  });

  it("skips the preview entirely while the configuration is incomplete", async () => {
    const { result } = renderHook(() => useClientProvisioningLogic());
    act(() => {
      result.current.setBillingCountry("NG");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PREVIEW_PRICING_DEBOUNCE_MS * 2);
    });

    expect(
      mockSilentClientApi.mock.calls.filter(([, path]) => String(path).includes("preview-pricing"))
    ).toHaveLength(0);
    expect(result.current.pricingSummary.isEstimate).toBe(false);
  });

  it("attaches the reviewed estimate as expected_total on the create payload", async () => {
    mockClientApi.mockResolvedValue({ data: { payment: { required: true } } });
    const { result } = await setupCompleteConfiguration();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PREVIEW_PRICING_DEBOUNCE_MS + 50);
    });
    expect(result.current.pricingSummary.isEstimate).toBe(true);

    await runWithTimers(() => result.current.handleCreateOrder());

    expect(mockClientApi).toHaveBeenCalledTimes(1);
    const [, , createPayload] = mockClientApi.mock.calls[0]! as [
      string,
      string,
      Record<string, unknown>,
    ];
    expect(createPayload.expected_total).toBe(15750.25);
  });

  it("does not arm the price lock when no estimate was fetched", async () => {
    mockSilentClientApi.mockImplementation(async () => {
      throw new Error("pricing offline");
    });
    mockClientApi.mockResolvedValue({ data: { payment: { required: true } } });
    const { result } = await setupCompleteConfiguration();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PREVIEW_PRICING_DEBOUNCE_MS + 50);
    });

    await runWithTimers(() => result.current.handleCreateOrder());

    const [, , createPayload] = mockClientApi.mock.calls[0]! as [
      string,
      string,
      Record<string, unknown>,
    ];
    expect(createPayload).not.toHaveProperty("expected_total");
    expect(result.current.pricingSummary.isEstimate).toBe(false);
  });
});
