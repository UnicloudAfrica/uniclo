import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDataFetching } from "../useDataFetching";
import { createServiceProfile, type ServiceProfile } from "../../objectStorageUtils";

/*
 * Object-storage tier catalog regression.
 *
 * ProductPricing rows for object storage are seeded per-AZ with the AZ code in
 * their `region` column (ObjectStorageInventorySeeder), and the /product-pricing
 * endpoint matches `region` exactly. So the create-silo pricing fetch must be
 * keyed by the selected AZ code — not the region code — or it returns zero rows
 * and the tier dropdown comes back empty. These tests pin that producer↔consumer
 * alignment.
 */

const stubListHook = () => ({ data: [], isFetching: false });

function renderWithProfile(profile: ServiceProfile, pricingSpy: ReturnType<typeof vi.fn>) {
  return renderHook(() =>
    useDataFetching({
      useRegionsHook: stubListHook,
      useCountriesHook: stubListHook,
      usePricingHook: pricingSpy as never,
      serviceProfiles: [profile],
      effectiveCountryCode: "NG",
      selectedCurrency: "NGN",
    })
  );
}

describe("useDataFetching — object-storage pricing fetch key", () => {
  it("fetches pricing by the selected AZ code (where per-AZ rows actually live)", () => {
    const pricingSpy = vi.fn(() => ({ data: [], isFetching: false }));
    const profile: ServiceProfile = {
      ...createServiceProfile(),
      region: "uni-ng",
      availability_zone: "uni-ng-lag-az1",
    };

    renderWithProfile(profile, pricingSpy);

    expect(pricingSpy).toHaveBeenCalled();
    expect(pricingSpy.mock.calls[0][0]).toBe("uni-ng-lag-az1");
    expect(pricingSpy.mock.calls[0][1]).toBe("object_storage_configuration");
  });

  it("falls back to the region code until an AZ is chosen", () => {
    const pricingSpy = vi.fn(() => ({ data: [], isFetching: false }));
    const profile: ServiceProfile = {
      ...createServiceProfile(),
      region: "uni-ng",
      availability_zone: "",
    };

    renderWithProfile(profile, pricingSpy);

    expect(pricingSpy.mock.calls[0][0]).toBe("uni-ng");
  });
});
