import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * MonthlyCostCell — pinned currency-aware rendering contract.
 *
 * The cell sits in the Database Fleet table and replaces the older
 * `formatCurrency(value)` helper that hardcoded a `$` prefix. The bug:
 * NGN-denominated rows rendered as `$49,643.17`, which made a tenant
 * think their micro Postgres cost USD 49k/month.
 *
 * What this file pins:
 *
 *   1. Source-currency identity — when the row's currency matches the
 *      user's preferred display currency, the cell renders without a
 *      network call and with the right symbol.
 *   2. Cross-currency conversion via the published FX rate — NGN row +
 *      USD preference produces a USD-formatted converted amount.
 *   3. Fallback when no rate is published — render with the SOURCE
 *      symbol, never with the display symbol attached to an unconverted
 *      number.
 *   4. Edge cases: missing currency defaults to USD; zero / negative
 *      amounts show "—" instead of a misleading "$0.00".
 */

const mockSilentApi = vi.fn();
// `useFormatPrice` imports via the relative path `../index/silent`. The
// mock target must match the *resolved* module identifier, so we use
// the same `@/index/silent` alias the project's other tests use
// (resolves to `src/index/silent.ts` via vite tsconfig aliases).
vi.mock("@/index/silent", () => ({
  default: (...args: unknown[]) => mockSilentApi(...args),
}));
// Also mock via the relative path used inside useFormatPrice.ts —
// vitest matches mocks by the import specifier, so both forms are
// needed to cover all callers.
vi.mock("../../../../index/silent", () => ({
  default: (...args: unknown[]) => mockSilentApi(...args),
}));

// useCurrency is the user-preference source. We stub it per-test by
// pointing the module factory at a ref the test mutates.
const displayCurrencyRef = { current: "NGN" as "NGN" | "USD" };
vi.mock("@/hooks/useCurrency", () => {
  const table = {
    NGN: { code: "NGN", symbol: "₦", precision: 2 },
    USD: { code: "USD", symbol: "$", precision: 2 },
  };
  return {
    useCurrency: () => table[displayCurrencyRef.current],
    CURRENCY_TABLE: table,
  };
});

import MonthlyCostCell from "../MonthlyCostCell";

beforeEach(() => {
  // Each test owns its own mock state — the cross-currency test legitimately
  // hits the API, so without a reset, later tests would see stale call counts.
  mockSilentApi.mockReset();
});

function renderCell(amount: number | string | undefined, currency: string | undefined) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<MonthlyCostCell amount={amount} currency={currency} />, { wrapper: Wrapper });
}

describe("MonthlyCostCell — identity (source === display currency)", () => {
  it("renders an NGN amount with the ₦ symbol when user preference is NGN", () => {
    displayCurrencyRef.current = "NGN";
    renderCell(49643.17, "NGN");
    // Identity short-circuits — no API call should be made.
    expect(mockSilentApi).not.toHaveBeenCalled();
    expect(screen.getByText("₦49,643.17")).toBeInTheDocument();
  });

  it("renders a USD amount with the $ symbol when user preference is USD", () => {
    displayCurrencyRef.current = "USD";
    renderCell(35.5, "USD");
    expect(mockSilentApi).not.toHaveBeenCalled();
    expect(screen.getByText("$35.50")).toBeInTheDocument();
  });
});

describe("MonthlyCostCell — cross-currency via published FX rate", () => {
  it("converts an NGN row to USD when the user preference is USD and a rate exists", async () => {
    displayCurrencyRef.current = "USD";
    // Stub the rate response — NGN→USD at 1/1655 (≈ ₦49,643 / 1655 = $29.99)
    mockSilentApi.mockResolvedValueOnce({ data: { rate: 1 / 1655 } });

    renderCell(49643.17, "NGN");

    await waitFor(() => {
      // Converted amount should appear with USD symbol, NOT NGN symbol.
      expect(screen.getByText(/\$\d/)).toBeInTheDocument();
    });
    const cellText = screen.getByText(/\$\d/).textContent ?? "";
    expect(cellText.startsWith("$")).toBe(true);
    expect(cellText).not.toContain("₦");
  });
});

describe("MonthlyCostCell — fallback when no rate is published", () => {
  it("renders the source amount with the SOURCE currency symbol when the rate endpoint 404s", async () => {
    displayCurrencyRef.current = "USD";
    mockSilentApi.mockRejectedValueOnce(new Error("404 no rate published"));

    renderCell(49643.17, "NGN");

    // The fallback path renders source amount with NGN symbol — better
    // than $NGN-amount. The most important assertion: NOT a `$` prefix
    // on the NGN value.
    await waitFor(() => {
      expect(screen.getByText("₦49,643.17")).toBeInTheDocument();
    });
  });
});

describe("MonthlyCostCell — edge cases", () => {
  it('renders "—" for zero', () => {
    displayCurrencyRef.current = "NGN";
    renderCell(0, "NGN");
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it('renders "—" for negative amounts', () => {
    displayCurrencyRef.current = "NGN";
    renderCell(-10, "NGN");
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it('renders "—" for undefined amount', () => {
    displayCurrencyRef.current = "NGN";
    renderCell(undefined, "NGN");
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("defaults to USD when the row has no currency tag (legacy rows pre-migration)", () => {
    displayCurrencyRef.current = "USD";
    renderCell(35.5, undefined);
    // Identity (USD source assumed, USD display) → no API call
    expect(mockSilentApi).not.toHaveBeenCalled();
    expect(screen.getByText("$35.50")).toBeInTheDocument();
  });

  it("normalises lowercase currency codes via toUpperCase", () => {
    displayCurrencyRef.current = "NGN";
    renderCell(100, "ngn");
    expect(screen.getByText("₦100.00")).toBeInTheDocument();
  });
});
