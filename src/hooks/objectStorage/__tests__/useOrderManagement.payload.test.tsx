import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOrderManagement } from "../useOrderManagement";
import type { ResolvedProfile } from "@/hooks/useObjectStoragePricing";
import type { ObjectStoragePreviewSnapshot } from "@/utils/objectStoragePreviewPricing";

/*
 * Producer-side guarantee for the order payload:
 *  - `availability_zone` rides on every item (the backend provisions the
 *    account against the AZ's provider — written by
 *    InitiateObjectStorageOrderAction, consumed by the provider adapters).
 *  - `expected_subtotal` (pre-tax) + `expected_total` (tax-inclusive) are
 *    sourced from the SAME preview snapshot the wizard displayed, so the
 *    backend 409s on drift (price-lock convention, root CLAUDE.md). A stale or
 *    missing snapshot blocks the submit instead of price-locking on a figure
 *    the customer never saw.
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

const snapshot: ObjectStoragePreviewSnapshot = {
  // `key` is opaque to the hook — it only checks it equals previewPayloadKey.
  key: "fingerprint-A",
  preDiscountSubtotal: 48720,
  subtotal: 48720,
  tax: 3654,
  total: 52374,
  taxRate: 7.5,
  currency: "NGN",
};

const renderOrderHook = (
  resolvedProfiles: ResolvedProfile[],
  submitOrderFn: ReturnType<typeof vi.fn>,
  overrides: {
    previewSnapshot?: ObjectStoragePreviewSnapshot | null;
    previewPayloadKey?: string;
  } = {}
) =>
  renderHook(() =>
    useOrderManagement({
      isFastTrack: false,
      resolvedProfiles,
      effectiveCountryCode: "NG",
      selectedCurrency: "NGN",
      context: "admin",
      selectedTenantId: "",
      selectedUserId: "",
      submitOrderFn: submitOrderFn as unknown as (
        payload: Record<string, unknown>
      ) => Promise<unknown>,
      lastOrderSummary: null,
      setLastOrderSummary: vi.fn(),
      selectedPaymentOption: null,
      setSelectedPaymentOption: vi.fn(),
      previewSnapshot: "previewSnapshot" in overrides ? overrides.previewSnapshot : snapshot,
      previewPayloadKey:
        "previewPayloadKey" in overrides ? overrides.previewPayloadKey : snapshot.key,
    })
  );

describe("useOrderManagement payload", () => {
  it("sends availability_zone per item and echoes the previewed subtotal + tax-inclusive total", async () => {
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
    // Both locks come from the SAME preview snapshot the user reviewed.
    expect(payload.expected_subtotal).toBe(48720);
    expect(payload.expected_total).toBe(52374);
  });

  it("still sends expected_total (required) but skips the subtotal lock on an admin override", async () => {
    const submitOrderFn = vi.fn().mockResolvedValue({});
    const overridden = { ...profile, unitPriceOverride: "55", unitPrice: 55, subtotal: 66000 };
    const { result } = renderOrderHook([overridden], submitOrderFn);

    await act(async () => {
      await result.current.createOrder();
    });

    const payload = submitOrderFn.mock.calls[0][0] as Record<string, unknown>;
    // Subtotal lock stays off (the backend re-quotes overrides from catalog),
    // but expected_total must always be present or the create 422s.
    expect(payload.expected_subtotal).toBeUndefined();
    expect(payload.expected_total).toBe(52374);
  });

  it("blocks the submit (never calls create) when the preview snapshot is stale", async () => {
    const submitOrderFn = vi.fn().mockResolvedValue({});
    // Snapshot key no longer matches the currently priced payload key: a
    // price-affecting edit happened after the review.
    const { result } = renderOrderHook([profile], submitOrderFn, {
      previewPayloadKey: "fingerprint-B",
    });

    await expect(
      act(async () => {
        await result.current.createOrder();
      })
    ).rejects.toThrow(/price changed/i);

    expect(submitOrderFn).not.toHaveBeenCalled();
  });

  it("blocks the submit when no preview snapshot exists (preview failed)", async () => {
    const submitOrderFn = vi.fn().mockResolvedValue({});
    const { result } = renderOrderHook([profile], submitOrderFn, {
      previewSnapshot: null,
    });

    await expect(
      act(async () => {
        await result.current.createOrder();
      })
    ).rejects.toThrow(/price changed/i);

    expect(submitOrderFn).not.toHaveBeenCalled();
  });
});
