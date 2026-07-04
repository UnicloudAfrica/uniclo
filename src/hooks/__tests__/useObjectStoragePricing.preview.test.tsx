import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useObjectStoragePricing } from "../useObjectStoragePricing";
import { OBJECT_STORAGE_PREVIEW_DEBOUNCE_MS } from "../../utils/objectStoragePreviewPricing";
import type { ServiceProfile } from "../objectStorageUtils";

/*
 * Pre-order pricing preview (object-storage wizard): while configuring, the
 * hook quotes the order via POST object-storage/orders/preview and surfaces
 * the tax-inclusive total via displayedTotals. The snapshot is keyed on the
 * priced payload so a stale preview can't be echoed after the user edits, and
 * a failed preview falls back to the pre-tax subtotal without crashing.
 */

// A profile whose tier resolves to a real productable_id so the preview
// payload is buildable (an unresolved tier skips the call entirely).
const serviceProfiles: ServiceProfile[] = [
  {
    id: "profile_1",
    name: "Preview Silo",
    region: "uni-ng",
    availability_zone: "uni-ng-lag-az1",
    tierKey: "__all__::9001",
    unitPriceOverride: "",
    months: "12",
    storageGb: "100",
  } as unknown as ServiceProfile,
];

// tierCatalog: the global bucket exposes tier 9001 at 40.6 NGN/GB so the
// resolved profile carries a positive subtotal (48720) and a productable_id.
const tierCatalog = new Map([
  [
    "__all__",
    {
      options: [{ value: "__all__::9001", label: "Object Storage (per GiB)" }],
      map: new Map([
        [
          "__all__::9001",
          {
            productable_id: 9001,
            // resolveTierUnitPricePerGb reads price_local; with no quota it is
            // treated as the per-GB rate → subtotal = 1 × 12 × 100 × 40.6.
            price_local: 40.6,
            currency: "NGN",
            name: "Object Storage (per GiB)",
          },
        ],
      ]),
    },
  ],
]);

const previewResponse = {
  success: true,
  data: {
    lines: [],
    pre_discount_subtotal: 48720.0,
    subtotal: 48720.0,
    tax: 3654.0,
    total: 52374.0,
    currency: "NGN",
    country_iso: "NG",
  },
};

const renderPricing = (previewOrderFn: ReturnType<typeof vi.fn>) =>
  renderHook(() =>
    useObjectStoragePricing(serviceProfiles, new Map(), tierCatalog, "NGN", null, null, {
      previewOrderFn: previewOrderFn as unknown as (
        payload: Record<string, unknown>
      ) => Promise<unknown>,
      effectiveCountryCode: "NG",
      selectedTenantId: "",
      selectedUserId: "",
      context: "admin",
      isFastTrack: false,
    })
  );

describe("useObjectStoragePricing preview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces a preview call and drives displayedTotals + previewSnapshot from the response", async () => {
    const previewOrderFn = vi.fn().mockResolvedValue(previewResponse);
    const { result } = renderPricing(previewOrderFn);

    // Nothing fires before the debounce window closes.
    expect(previewOrderFn).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(OBJECT_STORAGE_PREVIEW_DEBOUNCE_MS + 50);
    });

    expect(previewOrderFn).toHaveBeenCalledTimes(1);
    const payload = previewOrderFn.mock.calls[0][0] as Record<string, unknown>;
    const items = payload.object_storage_items as Array<Record<string, unknown>>;
    expect(items[0].availability_zone).toBe("uni-ng-lag-az1");
    expect(items[0].productable_id).toBe(9001);
    expect(payload.country_iso).toBe("NG");

    // The snapshot is fresh (key matches) and drives the tax-inclusive display.
    expect(result.current.previewSnapshot).toMatchObject({
      preDiscountSubtotal: 48720,
      tax: 3654,
      total: 52374,
      currency: "NGN",
    });
    expect(result.current.previewSnapshot?.key).toBe(result.current.previewPayloadKey);
    expect(result.current.displayedTotals.tax).toBe(3654);
    expect(result.current.displayedTotals.total).toBe(52374);
  });

  it("falls back to the pre-tax subtotal (tax 0) without crashing when the preview fails", async () => {
    const previewOrderFn = vi.fn().mockRejectedValue(new Error("preview offline"));
    const { result } = renderPricing(previewOrderFn);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(OBJECT_STORAGE_PREVIEW_DEBOUNCE_MS + 50);
    });

    expect(previewOrderFn).toHaveBeenCalledTimes(1);
    // No snapshot → displayedTotals stays the local pre-tax estimate.
    expect(result.current.previewSnapshot).toBeNull();
    expect(result.current.displayedTotals.subtotal).toBe(48720);
    expect(result.current.displayedTotals.tax).toBe(0);
  });
});
