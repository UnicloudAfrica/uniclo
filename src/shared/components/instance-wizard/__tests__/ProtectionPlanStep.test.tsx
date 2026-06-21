import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ComponentProps } from "react";
import ProtectionPlanStep from "../ProtectionPlanStep";

const { mockUseAcfServices } = vi.hoisted(() => ({
  mockUseAcfServices: vi.fn(),
}));

vi.mock("@/hooks/useCostExplorer", () => ({
  useFetchAcfPublicServices: mockUseAcfServices,
}));
vi.mock("@/hooks/resource", () => ({
  useFetchProductPricing: () => ({ data: [], isFetching: false }),
}));
vi.mock("@/shared/hooks/resources/regionHooks", () => ({
  useFetchAvailabilityZones: () => ({ data: [] }),
}));

const publishedCatalog = [
  { service_type: "backup", unit_price: 20 },
  { service_type: "replication", unit_price: 5000 },
];

const renderStep = (overrides: Partial<ComponentProps<typeof ProtectionPlanStep>> = {}) => {
  const onPlanChange = vi.fn();
  render(
    <ProtectionPlanStep
      selectedPlan="none"
      onPlanChange={onPlanChange}
      onBack={vi.fn()}
      onContinue={vi.fn()}
      {...overrides}
    />
  );
  return { onPlanChange };
};

describe("ProtectionPlanStep rates", () => {
  beforeEach(() => {
    mockUseAcfServices.mockReset();
  });

  it("marks paid plans as unpriced instead of fabricating rates when the catalog is empty", () => {
    mockUseAcfServices.mockReturnValue({ data: [], isFetching: false });

    const { onPlanChange } = renderStep();

    // backup_only + dr_standby + dr_replication all depend on missing rates.
    expect(screen.getAllByText("Rates not published yet")).toHaveLength(3);
    // No fabricated ₦16/GB or ₦12,000/VM figures anywhere.
    expect(screen.queryByText(/₦16\.00/)).toBeNull();
    expect(screen.queryByText(/₦12,000\.00/)).toBeNull();

    // Unpriced plans must not be selectable…
    fireEvent.click(screen.getByText("Backup Only").closest('[role="radio"]') as HTMLElement);
    expect(onPlanChange).not.toHaveBeenCalled();

    // …but the free plan still is.
    fireEvent.click(screen.getByText("No Protection").closest('[role="radio"]') as HTMLElement);
    expect(onPlanChange).toHaveBeenCalledWith("none");
  });

  it("shows a loading state (and does not clear the selection) while the catalog is fetching", () => {
    mockUseAcfServices.mockReturnValue({ data: undefined, isFetching: true });

    const { onPlanChange } = renderStep({ selectedPlan: "backup_only" });

    expect(screen.getAllByText("Loading rates…")).toHaveLength(3);
    expect(onPlanChange).not.toHaveBeenCalled();
  });

  it("prices plans from the published catalog rates", () => {
    mockUseAcfServices.mockReturnValue({ data: publishedCatalog, isFetching: false });

    const { onPlanChange } = renderStep({
      selectedPlan: "backup_only",
      storageGb: 50,
      instanceCount: 1,
    });

    // backup: 20/GB × 50 GB × 1 VM = ₦1,000.00 — sourced from the catalog.
    expect(screen.getAllByText("₦1,000.00").length).toBeGreaterThan(0);
    expect(screen.queryByText("Rates not published yet")).toBeNull();
    expect(onPlanChange).not.toHaveBeenCalled();
  });

  it("clears a selected plan whose rates turn out to be unpublished", () => {
    mockUseAcfServices.mockReturnValue({
      data: [{ service_type: "backup", unit_price: 20 }], // no replication row
      isFetching: false,
    });

    const { onPlanChange } = renderStep({ selectedPlan: "dr_replication" });

    expect(screen.getAllByText("Rates not published yet")).toHaveLength(1);
    expect(onPlanChange).toHaveBeenCalledWith("none");
  });

  it("never renders a zero DR cost line when the DR VM price is unresolved", () => {
    mockUseAcfServices.mockReturnValue({ data: publishedCatalog, isFetching: false });

    renderStep({
      selectedPlan: "dr_standby",
      storageGb: 50,
      instanceCount: 1,
      computePricePerVm: 0,
    });

    expect(screen.getByText("Price available after sizing")).toBeInTheDocument();
    expect(screen.queryByText(/₦0\.00/)).toBeNull();
  });
});
