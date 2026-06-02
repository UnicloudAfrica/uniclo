/**
 * Tests for ClientPaymentHistory (ClientTransaction.tsx).
 *
 * The page reads wallet transactions via useFetchTransactions and renders
 * them in a table, with an empty state when there are none. The hook is
 * mocked so the test exercises the page's rendering logic in isolation.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { WalletTransaction } from "@/shared/hooks/resources/transactionHooks";

// Mock the transaction hook (keep the real label/debit helpers).
vi.mock("@/shared/hooks/resources/transactionHooks", async (importActual) => {
  const actual = await importActual<
    typeof import("@/shared/hooks/resources/transactionHooks")
  >();
  return { ...actual, useFetchTransactions: vi.fn() };
});

// Keep money rendering trivial — currency machinery is tested elsewhere.
vi.mock("@/shared/components/ui/PriceLabel", () => ({
  PriceLabel: ({ amount, sourceCurrency }: { amount: number; sourceCurrency: string }) => (
    <span>
      {amount} {sourceCurrency}
    </span>
  ),
}));

// Thin shells — not under test here.
vi.mock("../../components/clientActiveTab", () => ({ default: () => null }));
vi.mock("../../components/ClientPageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { useFetchTransactions } from "@/shared/hooks/resources/transactionHooks";
import ClientPaymentHistory from "../ClientTransaction";

const mockUseFetchTransactions = vi.mocked(useFetchTransactions);

const tx = (over: Partial<WalletTransaction> = {}): WalletTransaction => ({
  id: 1,
  uuid: "tx-1",
  type: "credit",
  amount: "5000",
  balance_before: 0,
  balance_after: 5000,
  currency: "NGN",
  source: null,
  reference: "REF-1",
  description: "Wallet funding",
  status: "completed",
  metadata: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("ClientPaymentHistory", () => {
  it("renders transaction rows when data is present", () => {
    mockUseFetchTransactions.mockReturnValue({
      data: { data: [tx()], meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 } },
      isLoading: false,
    } as ReturnType<typeof useFetchTransactions>);

    render(<ClientPaymentHistory />);

    expect(screen.getByText("Wallet Top-up")).toBeInTheDocument();
    expect(screen.getByText(/5000 NGN/)).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders the empty state when there are no transactions", () => {
    mockUseFetchTransactions.mockReturnValue({
      data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } },
      isLoading: false,
    } as ReturnType<typeof useFetchTransactions>);

    render(<ClientPaymentHistory />);

    expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
  });
});
