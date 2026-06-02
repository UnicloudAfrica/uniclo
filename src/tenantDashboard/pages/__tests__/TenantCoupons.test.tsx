/**
 * Tests for the tenant Coupons page.
 *
 * `useApiContext` + `apiRegistry` are mocked so the real coupon hooks
 * (built via `createResourceHooks`) execute end-to-end through their HTTP
 * layer. This exercises the producer↔consumer contract: the fake silentApi
 * returns the `{ data, meta }` envelope the backend CouponController ships,
 * and the create/deactivate assertions verify the exact request shape the
 * backend StoreCouponRequest / destroy route expect.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/hooks/useApiContext", () => ({
  useApiContext: () => ({ context: "tenant" }),
}));

vi.mock("@/shared/api/apiRegistry", () => ({
  apiRegistry: {
    tenant: {
      urlPrefix: "/api/v1/tenant",
      silentApi: { get: (...a: unknown[]) => mockGet(...a) },
      toastApi: {
        post: (...a: unknown[]) => mockPost(...a),
        delete: (...a: unknown[]) => mockDelete(...a),
      },
    },
  },
}));

// Keep money rendering deterministic — no FX network lookup in tests.
vi.mock("@/hooks/useFormatPrice", () => ({
  useFormatPrice: (amount: number, currency: string) => ({
    formatted: `${currency} ${amount.toFixed(2)}`,
    displayAmount: amount,
    displayCurrency: currency,
    rate: 1,
    isLoading: false,
    fallback: false,
  }),
}));

import TenantCoupons from "../TenantCoupons";

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

const couponsEnvelope = {
  data: [
    {
      id: 1,
      code: "WELCOME10",
      type: "percentage",
      value: "10.00",
      currency: null,
      max_redemptions: 100,
      times_redeemed: 4,
      expires_at: "2026-12-31T00:00:00Z",
      active: true,
    },
    {
      id: 2,
      code: "FLAT25",
      type: "fixed",
      value: "25.00",
      currency: "USD",
      max_redemptions: null,
      times_redeemed: 0,
      expires_at: null,
      active: true,
    },
  ],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
};

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockDelete.mockReset();
});

describe("TenantCoupons", () => {
  it("shows the loading state while coupons are being fetched", () => {
    let resolve: (v: unknown) => void = () => {};
    mockGet.mockReturnValue(new Promise((r) => (resolve = r)));

    renderPage(<TenantCoupons />);

    expect(screen.getByText(/Loading coupons/i)).toBeInTheDocument();
    resolve({ data: [], meta: {} });
  });

  it("shows the empty state when there are no coupons", async () => {
    mockGet.mockResolvedValue({ data: [], meta: {} });

    renderPage(<TenantCoupons />);

    await waitFor(() => {
      expect(screen.getByText("No coupons yet")).toBeInTheDocument();
    });
  });

  it("lists coupons with percentage and money-formatted fixed discounts", async () => {
    mockGet.mockResolvedValue(couponsEnvelope);

    renderPage(<TenantCoupons />);

    await waitFor(() => {
      expect(screen.getByText("WELCOME10")).toBeInTheDocument();
    });
    // Percentage discount rendered as a percent, fixed via PriceLabel (no hardcoded symbol).
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("USD 25.00")).toBeInTheDocument();
    // Redemption counters surface remaining capacity.
    expect(screen.getByText("4 / 100")).toBeInTheDocument();
  });

  it("creates a fixed coupon with the exact backend payload", async () => {
    mockGet.mockResolvedValue({ data: [], meta: {} });
    mockPost.mockResolvedValue({ data: { id: 9 } });

    renderPage(<TenantCoupons />);

    await waitFor(() => {
      expect(screen.getByText("No coupons yet")).toBeInTheDocument();
    });

    // Open the create modal (the empty-state CTA).
    fireEvent.click(screen.getByRole("button", { name: /New coupon/i }));

    fireEvent.change(screen.getByPlaceholderText("WELCOME10"), {
      target: { value: "FLAT25" },
    });
    // Switch type → fixed, which reveals the currency field.
    fireEvent.change(screen.getByDisplayValue("Percentage"), {
      target: { value: "fixed" },
    });
    fireEvent.change(screen.getByPlaceholderText("25"), { target: { value: "25" } });
    fireEvent.change(screen.getByPlaceholderText("USD"), { target: { value: "usd" } });
    fireEvent.change(screen.getByPlaceholderText("Unlimited"), {
      target: { value: "50" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create coupon/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledTimes(1);
    });
    const [url, payload] = mockPost.mock.calls[0];
    expect(url).toBe("/api/v1/tenant/coupons");
    expect(payload).toEqual({
      code: "FLAT25",
      type: "fixed",
      value: 25,
      currency: "USD",
      max_redemptions: 50,
    });
  });

  it("deactivates a coupon via DELETE after confirmation", async () => {
    mockGet.mockResolvedValue(couponsEnvelope);
    mockDelete.mockResolvedValue({ message: "Coupon deleted" });

    renderPage(<TenantCoupons />);

    await waitFor(() => {
      expect(screen.getByText("WELCOME10")).toBeInTheDocument();
    });

    // Trigger the confirm dialog from the first row's Deactivate button.
    fireEvent.click(screen.getAllByRole("button", { name: /Deactivate/i })[0]);

    // Confirm inside the dialog.
    await waitFor(() => {
      expect(screen.getByText(/can no longer be redeemed/i)).toBeInTheDocument();
    });
    const confirmButtons = screen.getAllByRole("button", { name: /^Deactivate$/i });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });
    expect(mockDelete).toHaveBeenCalledWith("/api/v1/tenant/coupons/1");
  });
});
