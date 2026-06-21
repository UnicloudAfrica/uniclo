import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInstanceOrderCreation } from "../useInstanceOrderCreation";
import { PREVIEW_PRICING_DEBOUNCE_MS } from "../../utils/instancePreviewPricing";
import type { Configuration } from "../../types/InstanceConfiguration";

/*
 * Live pre-order pricing estimate. As the operator configures, the hook
 * debounce-POSTs to /instances/preview-pricing and exposes `priceEstimate`
 * (the previewed compute total PLUS the selected protection plan's monthly
 * fee, which the backend adds to the order total the same way at submit) so
 * the summary shows a running price before any order exists. Mirrors the
 * client/tenant provisioning wizards.
 */

vi.mock("../useApiContext", () => ({
  useApiContext: () => ({
    context: "admin",
    apiBaseUrl: "http://api.test",
    authHeaders: { "Content-Type": "application/json" },
  }),
}));

vi.mock("@/utils/toastUtil", () => ({
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const baseConfig = {
  id: "cfg-1",
  name: "est-vm",
  region: "uni-ng",
  availability_zone: "uni-ng-az-1",
  project_mode: "new",
  project_name: "Estimate Project",
  network_preset: "standard",
  compute_instance_id: "42",
  os_image_id: "7",
  volume_type_id: "3",
  storage_size_gb: 50,
  months: 1,
  instance_count: 1,
  keypair_name: "ops-key",
} as unknown as Configuration;

const previewResponse = {
  ok: true,
  status: 200,
  json: async () => ({ data: { grand_total: 1000, currency: "NGN" } }),
};

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const renderOrderHook = (protectionPlan?: { plan: string; monthlyCost?: number }) =>
  renderHook(() =>
    useInstanceOrderCreation({
      configurations: [baseConfig],
      isFastTrack: false,
      billingCountry: "NG",
      contextType: "",
      selectedTenantId: "",
      selectedUserId: "",
      setActiveStep: vi.fn(),
      protectionPlan,
      paymentStepIndex: 3,
      reviewStepIndex: 4,
    })
  );

const settlePreview = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(PREVIEW_PRICING_DEBOUNCE_MS + 50);
  });
};

describe("useInstanceOrderCreation live pricing estimate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes("preview-pricing")
        ? previewResponse
        : { ok: true, status: 200, json: async () => ({ data: {} }) }
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounce-quotes preview-pricing and exposes the estimate", async () => {
    const { result } = renderOrderHook();
    await settlePreview();

    const previewCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/instances/preview-pricing")
    );
    expect(previewCall).toBeTruthy();
    expect(result.current.priceEstimate).toEqual({ total: 1000, currency: "NGN" });
  });

  it("folds the protection-plan monthly fee into the estimate total", async () => {
    const { result } = renderOrderHook({ plan: "backup_only", monthlyCost: 240 });
    await settlePreview();

    expect(result.current.priceEstimate).toEqual({ total: 1240, currency: "NGN" });
  });
});
