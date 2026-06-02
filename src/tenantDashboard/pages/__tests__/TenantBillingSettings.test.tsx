/**
 * Tests for TenantBillingSettings — money rendering via useFormatPrice.
 *
 * Verifies that wallet balance and outstanding balance are rendered using
 * useFormatPrice(amount, currency) rather than a hardcoded Intl.NumberFormat
 * locale/currency, so they respect the tenant's currency from API data.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";

// ── Mocks ────────────────────────────────────────────────────────────

// Stub the shell so we don't need router / branding context.
vi.mock("../../dashboard/components/TenantPageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Stub settlement settings — it has its own network calls we don't need here.
vi.mock("@/shared/components/payment/TenantSettlementSettings", () => ({
  default: () => null,
}));

// Billing hook stubs — controlled per-test via mutable state objects.
const billingConfigState: { current: unknown } = { current: undefined };
const billingBalanceState: { current: unknown } = { current: undefined };

vi.mock("@/hooks/useTenantBilling", () => ({
  useTenantBillingConfig: () => billingConfigState.current,
  useTenantBillingBalance: () => billingBalanceState.current,
  useTenantPaymentGateways: () => ({ data: undefined, isLoading: false }),
  useSelectBillingModel: () => ({ mutate: vi.fn(), isPending: false }),
  useSavePaymentGateway: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeletePaymentGateway: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Track calls to useFormatPrice so we can assert the correct arguments.
const mockUseFormatPrice = vi.fn();

vi.mock("@/hooks/useFormatPrice", () => ({
  useFormatPrice: (...args: unknown[]) => mockUseFormatPrice(...args),
}));

// Import AFTER mocks are registered.
import TenantBillingSettings from "../TenantBillingSettings";

// ── Helpers ──────────────────────────────────────────────────────────

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  );
}

const makeFormatResult = (formatted: string) => ({
  formatted,
  displayAmount: 0,
  displayCurrency: "NGN",
  rate: 1,
  isLoading: false,
  fallback: false,
});

// ── Tests ─────────────────────────────────────────────────────────────

describe("TenantBillingSettings — money rendering", () => {
  beforeEach(() => {
    mockUseFormatPrice.mockReset();

    // Default: return a placeholder so the component always renders.
    mockUseFormatPrice.mockReturnValue(makeFormatResult("₦0.00"));

    billingConfigState.current = {
      data: {
        billing_model: "direct",
        allowed_billing_models: ["direct"],
        can_change_billing_model: false,
        allow_client_gateway: false,
      },
      isLoading: false,
    };

    billingBalanceState.current = {
      data: {
        wallet_balance_cents: 500000,
        total_outstanding_cents: 150000,
        settlements: [],
      },
      isLoading: false,
    };
  });

  it("calls useFormatPrice with wallet_balance_cents and the NGN fallback currency", () => {
    renderWithClient(<TenantBillingSettings />);

    expect(mockUseFormatPrice).toHaveBeenCalledWith(500000, "NGN");
  });

  it("calls useFormatPrice with total_outstanding_cents and the NGN fallback currency", () => {
    renderWithClient(<TenantBillingSettings />);

    expect(mockUseFormatPrice).toHaveBeenCalledWith(150000, "NGN");
  });

  it("uses the currency field from the API response when present", () => {
    billingBalanceState.current = {
      data: {
        wallet_balance_cents: 2000,
        total_outstanding_cents: 500,
        currency: "USD",
        settlements: [],
      },
      isLoading: false,
    };

    renderWithClient(<TenantBillingSettings />);

    expect(mockUseFormatPrice).toHaveBeenCalledWith(2000, "USD");
    expect(mockUseFormatPrice).toHaveBeenCalledWith(500, "USD");
  });

  it("renders the formatted string returned by useFormatPrice for wallet balance", () => {
    mockUseFormatPrice
      .mockReturnValueOnce(makeFormatResult("₦5,000.00"))  // wallet
      .mockReturnValueOnce(makeFormatResult("₦1,500.00")); // outstanding

    renderWithClient(<TenantBillingSettings />);

    expect(screen.getByText("₦5,000.00")).toBeTruthy();
  });

  it("renders the formatted string returned by useFormatPrice for outstanding balance", () => {
    mockUseFormatPrice
      .mockReturnValueOnce(makeFormatResult("₦5,000.00"))  // wallet
      .mockReturnValueOnce(makeFormatResult("₦1,500.00")); // outstanding

    renderWithClient(<TenantBillingSettings />);

    expect(screen.getByText("₦1,500.00")).toBeTruthy();
  });

  it("renders loading placeholder while balance is loading", () => {
    billingBalanceState.current = { data: undefined, isLoading: true };
    // useFormatPrice will be called with 0 / "NGN" (defaults while data is absent).
    mockUseFormatPrice.mockReturnValue(makeFormatResult("₦0.00"));

    renderWithClient(<TenantBillingSettings />);

    // Both balance cards show "..." during load.
    const placeholders = screen.getAllByText("...");
    expect(placeholders.length).toBeGreaterThanOrEqual(2);
  });
});
