/**
 * RevenueDashboard money rendering.
 *
 * Regression: the page printed every amount with a hardcoded "$" via
 * `${value.toFixed(2)}`, mislabeling tenant earnings (the platform bills in
 * naira). Money must be rendered through <PriceLabel> using the currency that
 * comes from the data. This test feeds "KES" so a hardcoded "$" or "NGN"
 * would fail — proving the currency is data-driven.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Keep money rendering trivial + deterministic — FX machinery is tested elsewhere.
vi.mock("@/shared/components/ui/PriceLabel", () => ({
  PriceLabel: ({ amount, sourceCurrency }: { amount: number; sourceCurrency: string }) => (
    <span>
      {amount} {sourceCurrency}
    </span>
  ),
}));

// Thin layout shell — not under test.
vi.mock("../../../dashboard/components/TenantPageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/services/tenantRegionApi", () => ({
  default: {
    fetchRevenueStats: vi.fn(),
    fetchRevenueShares: vi.fn(),
    exportRevenueShares: vi.fn(),
  },
}));

import tenantRegionApi from "@/services/tenantRegionApi";
import RevenueDashboard from "../RevenueDashboard";

beforeEach(() => {
  vi.mocked(tenantRegionApi.fetchRevenueStats).mockResolvedValue({
    // summary carries NO currency — the page must derive it from the shares.
    data: {
      summary: {
        total_revenue: 99999,
        total_platform_fee: 1500,
        total_tenant_share: 88499,
        total_orders: 7,
        pending_settlement: 500,
      },
    },
  } as never);
  vi.mocked(tenantRegionApi.fetchRevenueShares).mockResolvedValue({
    data: [
      {
        id: 1,
        created_at: "2026-01-01T00:00:00Z",
        region: { name: "Lagos" },
        order: { identifier: "ORD-1" },
        gross_amount: 12345,
        platform_fee_percentage: 12,
        platform_fee_amount: 1500,
        tenant_share_amount: 10845,
        currency: "KES",
        status: "settled",
      },
    ],
  } as never);
});

describe("RevenueDashboard money rendering", () => {
  it("renders summary totals in the currency derived from the data (not a hardcoded $)", async () => {
    render(<RevenueDashboard />);

    // Summary card has no currency of its own → derived from the share rows.
    expect(await screen.findByText("99999 KES")).toBeInTheDocument();
  });

  it("renders each row amount in that row's own currency", async () => {
    render(<RevenueDashboard />);

    expect(await screen.findByText("12345 KES")).toBeInTheDocument(); // gross
    expect(screen.getByText("10845 KES")).toBeInTheDocument(); // tenant share
  });

  it("never prints a hardcoded dollar amount", async () => {
    render(<RevenueDashboard />);
    await screen.findByText("99999 KES");

    expect(screen.queryByText((t) => /\$\s*\d/.test(t))).toBeNull();
  });
});
