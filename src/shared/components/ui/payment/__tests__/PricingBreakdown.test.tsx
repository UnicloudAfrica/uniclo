import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode, ReactElement } from "react";
import PricingBreakdown from "../PricingBreakdown";

// Stub the silent API + currency hook so PriceLabel (used internally
// by PricingBreakdown) doesn't try to hit a real endpoint.
vi.mock("@/index/silent", () => ({ default: vi.fn() }));
vi.mock("../../../../../index/silent", () => ({ default: vi.fn() }));
vi.mock("@/hooks/useCurrency", () => {
  const table = {
    NGN: { code: "NGN", symbol: "₦", precision: 2 },
    USD: { code: "USD", symbol: "$", precision: 2 },
  };
  return {
    useCurrency: () => table.NGN,
    CURRENCY_TABLE: table,
  };
});

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(ui, { wrapper: Wrapper });
}

/**
 * PricingBreakdown — transparent rendering contract.
 *
 * The breakdown component used to have a `Gateway adjustment` line that
 * fired whenever the total payable disagreed with the wizard's stored
 * subtotal+tax — even when the delta wasn't a gateway fee at all. A
 * customer was being asked to "pay" a ₦31,894.92 "gateway adjustment"
 * for what was actually a quote-vs-order mismatch.
 *
 * Tests pinned here:
 *
 *   1. When `lineItems` is provided, render them one-per-row. The
 *      payment page must show the same breakdown the wizard showed.
 *   2. When `gatewayFee` is provided, render its real label and rate
 *      ("Paystack processing fee — 1.5% + ₦100"). Never a generic
 *      "Gateway adjustment" for fees.
 *   3. When `hasAdjustment` is true, render a WARNING banner asking
 *      the user to refresh — NOT a silent line item.
 */

const baseAmounts = {
  resolvedSubtotal: 16510,
  resolvedTax: 1238.25,
  resolvedGatewayFees: 0,
  estimatedTotalResolved: 17748.25,
  adjustment: 0,
  displayCurrency: "NGN",
};

describe("PricingBreakdown — itemised line rendering", () => {
  it("renders each provided line item with its name and amount", () => {
    renderWithClient(
      <PricingBreakdown
        amountDetails={baseAmounts}
        displayPayableTotal={17748.25}
        hasAdjustment={false}
        lineItems={[
          { name: "Compute VM (1 vCPU, 1GB RAM, 10GB SSD)", total: 6390 },
          { name: "PostgreSQL Micro — Managed by StaqDB", total: 9200 },
          { name: "Automated Backups", total: 920 },
        ]}
      />,
    );
    expect(screen.getByText(/Compute VM \(1 vCPU/)).toBeInTheDocument();
    expect(screen.getByText(/PostgreSQL Micro/)).toBeInTheDocument();
    expect(screen.getByText(/Automated Backups/)).toBeInTheDocument();
  });

  it("does NOT render the legacy 'Subtotal' line when lineItems is provided", () => {
    renderWithClient(
      <PricingBreakdown
        amountDetails={baseAmounts}
        displayPayableTotal={17748.25}
        hasAdjustment={false}
        lineItems={[{ name: "Compute VM", total: 6390 }]}
      />,
    );
    // The lineItems render replaces the Subtotal aggregate.
    expect(screen.queryByText("Subtotal")).not.toBeInTheDocument();
  });

  it("falls back to the Subtotal line when no lineItems are provided", () => {
    renderWithClient(
      <PricingBreakdown
        amountDetails={baseAmounts}
        displayPayableTotal={17748.25}
        hasAdjustment={false}
      />,
    );
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
  });
});

describe("PricingBreakdown — gateway fee", () => {
  it("renders the gateway fee with its real label when provided", () => {
    renderWithClient(
      <PricingBreakdown
        amountDetails={baseAmounts}
        displayPayableTotal={17948.25}
        hasAdjustment={false}
        gatewayFee={{
          amount: 200,
          label: "Paystack processing fee",
          rate: "1.5% + NGN 100.00 capped at NGN 2000.00",
        }}
      />,
    );
    expect(screen.getByText("Paystack processing fee")).toBeInTheDocument();
    expect(screen.getByText(/1\.5%/)).toBeInTheDocument();
  });

  it("does NOT render a gateway fee line when amount is zero", () => {
    renderWithClient(
      <PricingBreakdown
        amountDetails={baseAmounts}
        displayPayableTotal={17748.25}
        hasAdjustment={false}
        gatewayFee={{ amount: 0, label: "Paystack processing fee" }}
      />,
    );
    expect(screen.queryByText("Paystack processing fee")).not.toBeInTheDocument();
    expect(screen.queryByText("Gateway processing fee")).not.toBeInTheDocument();
  });
});

describe("PricingBreakdown — mismatch warning (replaces magic 'Gateway adjustment' line)", () => {
  it("renders a warning banner when hasAdjustment is true", () => {
    renderWithClient(
      <PricingBreakdown
        amountDetails={{ ...baseAmounts, adjustment: 31894.92 }}
        displayPayableTotal={49643.17}
        hasAdjustment={true}
        lineItems={[
          { name: "Compute VM", total: 6390 },
          { name: "Management fee", total: 9200 },
        ]}
      />,
    );
    const warning = screen.getByTestId("pricing-mismatch-warning");
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveTextContent(/Price-quote mismatch detected/);
    expect(warning).toHaveTextContent(/refresh the page/);
    expect(warning).toHaveTextContent(/Do not proceed/);
  });

  it("does NOT render the legacy 'Gateway adjustment' line as a price item — only as a warning", () => {
    renderWithClient(
      <PricingBreakdown
        amountDetails={{ ...baseAmounts, adjustment: 31894.92 }}
        displayPayableTotal={49643.17}
        hasAdjustment={true}
      />,
    );
    // The string "Gateway adjustment" must NOT appear as a benign line
    // item label anywhere in the rendered breakdown.
    expect(screen.queryByText("Gateway adjustment")).not.toBeInTheDocument();
  });

  it("renders neither warning nor adjustment line when hasAdjustment is false", () => {
    renderWithClient(
      <PricingBreakdown
        amountDetails={baseAmounts}
        displayPayableTotal={17748.25}
        hasAdjustment={false}
      />,
    );
    expect(screen.queryByTestId("pricing-mismatch-warning")).not.toBeInTheDocument();
    expect(screen.queryByText("Gateway adjustment")).not.toBeInTheDocument();
  });
});

describe("PricingBreakdown — total payable line", () => {
  it("always renders the Total payable line", () => {
    renderWithClient(
      <PricingBreakdown
        amountDetails={baseAmounts}
        displayPayableTotal={17748.25}
        hasAdjustment={false}
      />,
    );
    expect(screen.getByText("Total payable")).toBeInTheDocument();
  });
});
