import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import ApplyToRegionsModal from "../ApplyToRegionsModal";
import type { ApplyToRegionsItem } from "../ApplyToRegionsModal";

/*
 * The single-product summary renders its `price_usd` through the canonical
 * PriceLabel (source currency USD), not a hardcoded `$…/mo` string. With the
 * display currency mocked to NGN and a published rate, the amount converts —
 * proving it flows through useFormatPrice rather than raw toFixed formatting.
 */

const mockSilentApi = vi.fn();
// PriceLabel → useFormatPrice → src/index/silent (no @/index alias; use relative).
vi.mock("../../../index/silent", () => ({
  default: (...args: unknown[]) => mockSilentApi(...args),
}));
vi.mock("../../../hooks/useCurrency", () => {
  const table = {
    NGN: { code: "NGN", symbol: "₦", precision: 2 },
    USD: { code: "USD", symbol: "$", precision: 2 },
  };
  return { useCurrency: () => table.NGN, CURRENCY_TABLE: table };
});

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const item: ApplyToRegionsItem = {
  productable_type: "compute_instance",
  productable_id: 1,
  product_name: "Small Instance",
  price_usd: 10,
};

describe("ApplyToRegionsModal price display", () => {
  beforeEach(() => {
    mockSilentApi.mockReset();
  });

  it("renders the single-item price via PriceLabel (FX-converted, no hardcoded $)", async () => {
    mockSilentApi.mockResolvedValue({
      data: {
        rate: 1600,
        source_currency: "USD",
        target_currency: "NGN",
        fx_source: "published",
      },
    });

    renderWithClient(
      <ApplyToRegionsModal
        isOpen
        onClose={() => {}}
        items={[item]}
        provider="platform"
        sourceRegion="lagos"
        regions={[]}
        onApply={vi.fn()}
        isApplying={false}
      />,
    );

    // 10 USD × 1600 = ₦16,000.00 — proves the canonical formatter ran.
    expect(await screen.findByText("₦16,000.00")).toBeInTheDocument();
    // The "/mo" suffix is preserved alongside the converted amount.
    expect(screen.getByText("/mo")).toBeInTheDocument();
  });
});
