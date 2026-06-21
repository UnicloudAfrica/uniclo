import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOrderManagement } from "../useOrderManagement";
import type { ResolvedProfile } from "@/hooks/useObjectStoragePricing";

/*
 * Producer-side guarantee for the order payload:
 *  - `availability_zone` rides on every item (the backend provisions the
 *    account against the AZ's provider — written by
 *    InitiateObjectStorageOrderAction, consumed by the provider adapters).
 *  - `expected_subtotal` carries the reviewed pre-tax price so the backend
 *    can 409 on drift (price-lock convention, root CLAUDE.md).
 */

const profile: ResolvedProfile = {
  id: "profile_test",
  name: "Payload Test Silo",
  region: "uni-ng",
  availability_zone: "uni-ng-lag-az1",
  tierKey: "__all__::9001",
  unitPriceOverride: "",
  months: 12,
  storageGb: 100,
  regionKey: "uni-ng",
  regionData: null,
  tierOptions: [{ value: "__all__::9001", label: "Object Storage (per GiB)" }],
  usingFallbackCatalog: true,
  tierRow: { productable_id: 9001 },
  tierData: { productable_id: 9001 },
  tierQuotaGb: 1,
  fallbackUnitPrice: 40.6,
  unitPrice: 40.6,
  quantity: 1,
  subtotal: 48720,
  currency: "NGN",
  hasTierData: true,
  tierName: "Object Storage (per GiB)",
};

const renderOrderHook = (resolvedProfiles: ResolvedProfile[], submitOrderFn: ReturnType<typeof vi.fn>) =>
  renderHook(() =>
    useOrderManagement({
      isFastTrack: false,
      resolvedProfiles,
      effectiveCountryCode: "NG",
      selectedCurrency: "NGN",
      context: "admin",
      selectedTenantId: "",
      selectedUserId: "",
      submitOrderFn,
      lastOrderSummary: null,
      setLastOrderSummary: vi.fn(),
      selectedPaymentOption: null,
      setSelectedPaymentOption: vi.fn(),
    })
  );

describe("useOrderManagement payload", () => {
  it("sends availability_zone per item and the reviewed expected_subtotal", async () => {
    const submitOrderFn = vi.fn().mockResolvedValue({});
    const { result } = renderOrderHook([profile], submitOrderFn);

    await act(async () => {
      await result.current.createOrder();
    });

    expect(submitOrderFn).toHaveBeenCalledTimes(1);
    const payload = submitOrderFn.mock.calls[0][0] as Record<string, unknown>;
    const items = payload.object_storage_items as Array<Record<string, unknown>>;

    expect(items[0].availability_zone).toBe("uni-ng-lag-az1");
    expect(items[0].region).toBe("uni-ng");
    expect(items[0].productable_id).toBe(9001);
    expect(payload.expected_subtotal).toBe(48720);
  });

  it("omits the price lock when an admin unit-price override is active", async () => {
    const submitOrderFn = vi.fn().mockResolvedValue({});
    const overridden = { ...profile, unitPriceOverride: "55", unitPrice: 55, subtotal: 66000 };
    const { result } = renderOrderHook([overridden], submitOrderFn);

    await act(async () => {
      await result.current.createOrder();
    });

    const payload = submitOrderFn.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.expected_subtotal).toBeUndefined();
  });
});
