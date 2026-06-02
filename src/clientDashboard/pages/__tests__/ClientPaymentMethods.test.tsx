/**
 * Tests for the client saved-cards / payment-methods page.
 *
 * The page bottoms out in the real `paymentMethodHooks` (useSavedCards /
 * useAddCard / useRemoveCard), so the producer↔consumer contract with the
 * Business `PaymentMethodController` is exercised end-to-end through the
 * apiRegistry client layer:
 *   GET    business/payment-methods            (list)
 *   POST   business/payment-methods            (begin tokenization)
 *   DELETE business/payment-methods/{card}     (remove)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";

// ── Mocks ────────────────────────────────────────────────────────────

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/hooks/useApiContext", () => ({
  useApiContext: () => ({ context: "client" }),
}));

vi.mock("@/shared/api/apiRegistry", () => ({
  apiRegistry: {
    client: {
      silentApi: { get: (...args: unknown[]) => mockGet(...args) },
      toastApi: {
        post: (...args: unknown[]) => mockPost(...args),
        delete: (...args: unknown[]) => mockDelete(...args),
      },
      urlPrefix: "/business",
    },
  },
}));

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("@/utils/toastUtil", () => ({
  default: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));

import ClientPaymentMethods from "../ClientPaymentMethods";

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

const SAMPLE_CARD = {
  id: 42,
  identifier: "card_42",
  card_type: "visa",
  last4: "4242",
  exp_month: "08",
  exp_year: "2027",
  bank: "GTBank",
  payment_gateway: "Paystack",
  active: true,
};

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockDelete.mockReset();
  toastError.mockReset();
  toastSuccess.mockReset();
});

// ── Tests ────────────────────────────────────────────────────────────

describe("ClientPaymentMethods", () => {
  it("shows a loading state while cards are fetching", () => {
    mockGet.mockImplementation(() => new Promise(() => {})); // never resolves

    renderPage(<ClientPaymentMethods />);

    expect(screen.getByText("Loading payment methods…")).toBeTruthy();
  });

  it("shows an empty state when there are no saved cards", async () => {
    mockGet.mockResolvedValue({ data: [] });

    renderPage(<ClientPaymentMethods />);

    await waitFor(() => expect(screen.getByText("No saved cards")).toBeTruthy());
    // Hits the masked listing endpoint under the business prefix.
    expect(mockGet).toHaveBeenCalledWith("/business/payment-methods");
  });

  it("renders saved cards with masked brand, last4 and expiry", async () => {
    mockGet.mockResolvedValue({ data: [SAMPLE_CARD] });

    renderPage(<ClientPaymentMethods />);

    await waitFor(() => expect(screen.getByText(/VISA •••• 4242/)).toBeTruthy());
    expect(screen.getByText(/Expires 08\/2027/)).toBeTruthy();
    expect(screen.getByText(/GTBank/)).toBeTruthy();
  });

  it("begins tokenization and redirects to the Paystack authorization URL", async () => {
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({
      data: {
        authorization_url: "https://checkout.paystack.com/abc123",
        access_code: "access_abc123",
        reference: "ADDCARD-REF",
      },
    });

    // jsdom's real location.href setter throws "navigation not implemented";
    // swap in a plain writable location so we can assert the redirect target.
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation, href: "" },
    });

    renderPage(<ClientPaymentMethods />);
    await waitFor(() => expect(screen.getByText("No saved cards")).toBeTruthy());

    fireEvent.click(screen.getAllByText("Add card")[0]);

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("/business/payment-methods", {}));
    await waitFor(() => expect(window.location.href).toBe("https://checkout.paystack.com/abc123"));

    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("surfaces an error toast when tokenization returns no authorization URL", async () => {
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({ data: { authorization_url: null } });

    renderPage(<ClientPaymentMethods />);
    await waitFor(() => expect(screen.getByText("No saved cards")).toBeTruthy());

    fireEvent.click(screen.getAllByText("Add card")[0]);

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Could not start card setup. Please try again.")
    );
  });

  it("removes a saved card by id and refetches the list", async () => {
    // First load: one card. After delete + invalidation: empty.
    mockGet.mockResolvedValueOnce({ data: [SAMPLE_CARD] }).mockResolvedValue({ data: [] });
    mockDelete.mockResolvedValue({ success: true, message: "Card deleted successfully." });

    renderPage(<ClientPaymentMethods />);
    await waitFor(() => expect(screen.getByText(/VISA •••• 4242/)).toBeTruthy());

    fireEvent.click(screen.getByText("Remove"));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("/business/payment-methods/42"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Card removed"));
    // List re-queried after invalidation → empty state now visible.
    await waitFor(() => expect(screen.getByText("No saved cards")).toBeTruthy());
  });
});
