import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTenantProvisioningLogic } from "../useTenantProvisioningLogic";
import { PREVIEW_PRICING_DEBOUNCE_MS } from "../../utils/instancePreviewPricing";
import type { Configuration } from "../../types/InstanceConfiguration";

/*
 * Pre-order pricing estimate (tenant wizard): standard mode quotes the
 * order via POST /admin/instances/preview-pricing and price-locks the
 * create payload with expected_total. The backend adds the protection
 * plan's monthly fee to the grand total BEFORE the 409 guard runs, so the
 * lock must fold that fee in. Fast-track shows no totals and must neither
 * preview nor lock.
 */

const { mockTenantApi, mockSilentApi, mockSearchParams } = vi.hoisted(() => ({
  mockTenantApi: vi.fn(),
  mockSilentApi: vi.fn(),
  mockSearchParams: { value: new URLSearchParams() },
}));

vi.mock("../../index/tenant/tenantApi", () => ({ default: mockTenantApi }));
vi.mock("../../index/silent", () => ({ default: mockSilentApi }));
vi.mock("react-router-dom", () => ({
  useSearchParams: () => [mockSearchParams.value, vi.fn()],
}));
vi.mock("@/stores/authStore", () => ({
  default: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ isAuthenticated: true, user: { id: 1 } }),
}));
vi.mock("../tenantHooks/useTenantCustomerContext", () => ({
  useTenantCustomerContext: () => ({
    contextType: "internal",
    setContextType: vi.fn(),
    selectedTenantId: "",
    setSelectedTenantId: vi.fn(),
    selectedUserId: "",
    setSelectedUserId: vi.fn(),
    tenants: [],
    isTenantsFetching: false,
    userPool: [],
    isUsersFetching: false,
    selfTenant: { id: "tenant-self" },
  }),
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

const previewResponse = { data: { grand_total: 1000, currency: "NGN" } };

const previewCalls = () =>
  mockSilentApi.mock.calls.filter(([, path]) => String(path).includes("preview-pricing"));

const runWithTimers = async (action: () => Promise<unknown>) => {
  await act(async () => {
    const pending = action();
    await vi.advanceTimersByTimeAsync(1000);
    await pending;
  });
};

const setupHook = async (protectionPlan?: {
  plan: string;
  monthlyCost: number;
  redundancyPattern?: string;
}) => {
  const rendered = renderHook(() => useTenantProvisioningLogic({ protectionPlan }));
  act(() => {
    rendered.result.current.setBillingCountry("NG");
  });
  act(() => {
    const cfgId = rendered.result.current.configurations[0]!.id;
    rendered.result.current.updateConfiguration(cfgId, completeConfigPatch);
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(PREVIEW_PRICING_DEBOUNCE_MS + 50);
  });
  return rendered;
};

describe("useTenantProvisioningLogic pre-order pricing estimate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockTenantApi.mockReset();
    mockSilentApi.mockReset();
    mockSearchParams.value = new URLSearchParams();
    mockSilentApi.mockImplementation(async (_method: string, path: string) =>
      path.includes("preview-pricing") ? previewResponse : { data: null }
    );
    mockTenantApi.mockResolvedValue({ data: { payment: { required: true } } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("quotes the tenant-priced estimate and surfaces it via pricingSummary", async () => {
    const { result } = await setupHook();

    expect(previewCalls()).toHaveLength(1);
    const [method, path, payload] = previewCalls()[0]! as [string, string, Record<string, unknown>];
    expect(method).toBe("POST");
    expect(path).toBe("/admin/instances/preview-pricing");
    // Self context: the actor's own tenant must ride along so tenant
    // price overrides match what the create endpoint will bill.
    expect(payload.tenant_id).toBe("tenant-self");

    expect(result.current.pricingSummary).toMatchObject({
      grandTotal: 1000,
      currency: "NGN",
      isEstimate: true,
    });
  });

  it("folds the protection-plan fee for the full term into expected_total", async () => {
    const { result } = await setupHook({ plan: "backup_only", monthlyCost: 240 });

    await runWithTimers(() => result.current.handleCreateOrder());

    expect(mockTenantApi).toHaveBeenCalledTimes(1);
    const [, , createPayload] = mockTenantApi.mock.calls[0]! as [
      string,
      string,
      Record<string, unknown>,
    ];
    // Order is prepaid for its term (config months = 6); protection bills
    // fee × months, matching the backend: 1000 compute + 240 × 6 = 2440.
    expect(createPayload.expected_total).toBe(2440);
  });

  it("sends the bare estimate as expected_total when no protection plan is selected", async () => {
    const { result } = await setupHook();

    await runWithTimers(() => result.current.handleCreateOrder());

    const [, , createPayload] = mockTenantApi.mock.calls[0]! as [
      string,
      string,
      Record<string, unknown>,
    ];
    expect(createPayload.expected_total).toBe(1000);
  });

  it("neither previews nor price-locks in fast-track mode", async () => {
    mockSearchParams.value = new URLSearchParams("mode=fast-track");
    const { result } = await setupHook();

    expect(previewCalls()).toHaveLength(0);
    expect(result.current.pricingSummary.isEstimate).toBe(false);
  });
});
