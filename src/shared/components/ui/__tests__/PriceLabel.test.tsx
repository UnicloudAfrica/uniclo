import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/*
 * PriceLabel renders the backend `formatted_display` verbatim when an
 * envelope is supplied, otherwise falls back to `useFormatPrice`.
 */

const mockSilentApi = vi.fn();
vi.mock("../../../../index/silent", () => ({
  default: (...args: unknown[]) => mockSilentApi(...args),
}));
vi.mock("../../../../hooks/useCurrency", () => {
  const table = {
    NGN: { code: "NGN", symbol: "₦", precision: 2 },
    USD: { code: "USD", symbol: "$", precision: 2 },
  };
  return { useCurrency: () => table.NGN, CURRENCY_TABLE: table };
});

import { PriceLabel } from "../PriceLabel";

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}

describe("PriceLabel", () => {
  beforeEach(() => {
    mockSilentApi.mockReset();
  });

  it("uses the backend-supplied envelope verbatim when available", () => {
    const { Wrapper } = makeWrapper();
    render(
      <PriceLabel
        amount={10}
        sourceCurrency="USD"
        envelope={{
          amount_display: 16000,
          currency_display: "NGN",
          formatted_display: "₦16,000.00",
          fx_source: "locked",
        }}
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByText("₦16,000.00")).toBeInTheDocument();
    expect(mockSilentApi).not.toHaveBeenCalled();
  });

  it("falls back to useFormatPrice when no envelope is supplied", async () => {
    mockSilentApi.mockResolvedValue({
      data: { rate: 1600, source_currency: "USD", target_currency: "NGN", fx_source: "published" },
    });

    const { Wrapper } = makeWrapper();
    render(<PriceLabel amount={10} sourceCurrency="USD" />, { wrapper: Wrapper });

    // Loading placeholder first.
    expect(await screen.findByText("₦16,000.00")).toBeInTheDocument();
  });
});
