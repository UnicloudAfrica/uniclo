import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

import PriceOverrideModal from "../PriceOverrideModal";
import type { PricingCatalogRow, TenantRegion } from "../pricingOverridesTypes";

/**
 * Verifies the tenant "set a per-SKU price" flow end to end at the UI layer:
 *  - a region-scoped override builds the exact payload the upsert hook posts
 *    (productable identity + provider key + region scope), and
 *  - the platform rule "tenant price must be ≥ the admin default" is enforced
 *    client-side by disabling Save (the backend also hard-rejects with 422).
 */

// AZ scope is only fetched when the user switches to the availability-zone
// scope; the default region-scope path never touches it. Stub it out.
vi.mock("@/hooks/adminHooks/regionHooks", () => ({
  useFetchAvailabilityZones: () => ({ data: [], isFetching: false }),
}));

const activeRegion: TenantRegion = {
  code: "uni-ng-lag",
  name: "Lagos",
  // Internal grouping key — sent in the override payload, never rendered.
  provider: "zadara",
  country_code: "NG",
};

const computeRow: PricingCatalogRow = {
  id: 5,
  product: {
    productable_type: "compute_instance",
    productable_id: 5,
    name: "c1.large",
  },
  pricing: { admin: { price_usd: 10, scope: "region" } },
};

function renderModal(overrides: Partial<React.ComponentProps<typeof PriceOverrideModal>> = {}) {
  const onUpsert = vi.fn().mockResolvedValue({ success: true });
  const onUpdate = vi.fn().mockResolvedValue({ success: true });
  const onSaveComplete = vi.fn();
  const onClose = vi.fn();
  render(
    <PriceOverrideModal
      isOpen
      onClose={onClose}
      row={computeRow}
      overrideInfo={null}
      activeRegion={activeRegion}
      selectedRegion="uni-ng-lag"
      regions={[activeRegion]}
      isSaving={false}
      onUpsert={onUpsert}
      onUpdate={onUpdate}
      onSaveComplete={onSaveComplete}
      {...overrides}
    />,
  );
  return { onUpsert, onUpdate, onSaveComplete, onClose };
}

describe("PriceOverrideModal — set a compute price override", () => {
  beforeEach(() => cleanup());

  it("posts a region-scoped override with the product identity + provider key", async () => {
    const { onUpsert, onSaveComplete, onClose } = renderModal();

    const priceInput = screen.getByRole("spinbutton");
    fireEvent.change(priceInput, { target: { value: "15" } });

    fireEvent.click(screen.getByRole("button", { name: "Save Override" }));

    await waitFor(() => expect(onUpsert).toHaveBeenCalledTimes(1));
    expect(onUpsert).toHaveBeenCalledWith({
      productable_type: "compute_instance",
      productable_id: 5,
      provider: "zadara",
      price_usd: 15,
      region: "uni-ng-lag",
    });
    // Modal closes + parent refreshes only after a successful save.
    expect(onSaveComplete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("blocks saving a price below the admin default", async () => {
    const { onUpsert } = renderModal();

    const priceInput = screen.getByRole("spinbutton");
    fireEvent.change(priceInput, { target: { value: "5" } }); // admin default is 10

    const saveButton = screen.getByRole("button", { name: "Save Override" });
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(saveButton);
    expect(onUpsert).not.toHaveBeenCalled();
  });
});
