/**
 * Tests for the client billing / invoices page payment flow.
 *
 * `handlePayInvoice` initialises payment via the `usePayInvoice`
 * mutation (POST business/billing/invoices/{id}/pay). When the
 * `invoice_generic_payment` flag is ON the backend returns a Paystack
 * hosted-checkout `authorization_url`; the page hands the customer off
 * to it via `window.location.assign`. The mutation is mocked here so we
 * exercise the page's redirect wiring, mirroring the established
 * authorization_url pattern in ClientPaymentMethods.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";

// ── Mocks ────────────────────────────────────────────────────────────

// Hoisted so the (also-hoisted) vi.mock factory can reference them
// without tripping the temporal-dead-zone on module-level consts.
const { mutateAsync, SAMPLE_INVOICE, SAMPLE_META } = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  SAMPLE_INVOICE: {
    id: 7,
    uuid: "inv-uuid-7",
    invoice_number: "INV-2026-0007",
    status: "pending" as const,
    currency: "NGN",
    subtotal: 10000,
    tax_amount: 0,
    discount_amount: 0,
    total: 10000,
    amount_paid: 0,
    amount_due: 10000,
    issue_date: "2026-05-01",
    due_date: "2026-05-15",
    paid_at: null,
    period_start: null,
    period_end: null,
    notes: null,
    owner_email: "customer@example.com",
  },
  SAMPLE_META: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
}));

vi.mock("@/hooks/useClientInvoices", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useClientInvoices")>(
    "@/hooks/useClientInvoices"
  );
  return {
    ...actual,
    useClientInvoices: () => ({
      data: { data: [SAMPLE_INVOICE], meta: SAMPLE_META },
      isLoading: false,
      refetch: vi.fn(),
    }),
    useBillingSummary: () => ({ data: undefined, isLoading: false }),
    usePayInvoice: () => ({ mutateAsync, isPending: false }),
  };
});

const toastError = vi.fn();
const toastInfo = vi.fn();
const toastSuccess = vi.fn();
vi.mock("@/utils/toastUtil", () => ({
  default: {
    error: (...args: unknown[]) => toastError(...args),
    info: (...args: unknown[]) => toastInfo(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));

// PaymentModal is consumed, not under test here (it boots react-paystack
// + the auth store). Stub it to a lightweight marker so we can assert it
// opens for the invoice without dragging in its internals.
vi.mock("@/shared/components/ui/PaymentModal", () => ({
  default: ({ isOpen, amount }: { isOpen: boolean; amount?: number }) =>
    isOpen ? <div data-testid="payment-modal">amount:{amount}</div> : null,
}));

import ClientBillingPage from "../ClientBillingPage";

// ── Helpers ──────────────────────────────────────────────────────────

const renderPage = (ui: ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  mutateAsync.mockReset();
  toastError.mockReset();
  toastInfo.mockReset();
  toastSuccess.mockReset();
});

// ── Tests ────────────────────────────────────────────────────────────

describe("ClientBillingPage — pay invoice", () => {
  it("initialises payment and redirects to the Paystack authorization URL", async () => {
    mutateAsync.mockResolvedValue({
      data: {
        authorization_url: "https://checkout.paystack.com/inv7",
        reference: "INVPAY-ABC123",
        amount: 10000,
        currency: "NGN",
      },
    });

    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { assign, href: "" },
    });

    renderPage(<ClientBillingPage />);

    // The payable invoice row exposes a "Pay Now" action.
    fireEvent.click(screen.getByRole("button", { name: /Pay Now/i }));

    // Mutation called with the invoice id.
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(7));
    // Customer is handed off to the hosted checkout URL.
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://checkout.paystack.com/inv7"));
    // No error/info toast on the happy path.
    expect(toastError).not.toHaveBeenCalled();
    expect(toastInfo).not.toHaveBeenCalled();
  });
});
