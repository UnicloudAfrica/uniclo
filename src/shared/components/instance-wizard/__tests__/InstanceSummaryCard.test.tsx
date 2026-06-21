import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import InstanceSummaryCard from "../InstanceSummaryCard";

/*
 * Pre-order estimates (pricingSummary.isEstimate from the client/tenant
 * provisioning hooks) must be labeled as estimates — the same numbers
 * after order creation are backend-billed and keep the original labels.
 */

vi.mock("@/hooks/networkPresetHooks", () => ({
  useNetworkPresets: () => ({ data: [] }),
}));

const renderCard = (isPriceEstimate: boolean) =>
  render(
    <InstanceSummaryCard
      configurations={[]}
      contextType="client"
      summaryGrandTotalValue={15750.25}
      summaryDisplayCurrency="NGN"
      isPriceEstimate={isPriceEstimate}
    />
  );

describe("InstanceSummaryCard estimate labelling", () => {
  it("labels pre-order totals as an estimate", () => {
    renderCard(true);

    expect(screen.getByText("Pricing estimate")).toBeInTheDocument();
    expect(screen.getByText("Estimated total")).toBeInTheDocument();
    expect(screen.queryByText("Total payable")).not.toBeInTheDocument();
    expect(
      screen.getByText(/final price is confirmed when you create the order/i)
    ).toBeInTheDocument();
  });

  it("keeps the billed labels for receipt-backed totals", () => {
    renderCard(false);

    expect(screen.getByText("Pricing breakdown")).toBeInTheDocument();
    expect(screen.getByText("Total payable")).toBeInTheDocument();
    expect(screen.queryByText("Pricing estimate")).not.toBeInTheDocument();
  });
});
