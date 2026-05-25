/**
 * Tests for `AdminMonitoringSubscriptions` (B7 frontend).
 *
 * Mocks the data layer at module boundary so assertions exercise filter
 * + pagination + navigation logic without touching `fetch`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ─── Hook mocks ──────────────────────────────────────────────────────

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const subscriptionsState: { current: unknown } = {
  current: {
    data: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
  },
};

// Capture the latest filters arg passed by the SUT so we can assert
// that the filters drive the query.
const lastFiltersArg: { current: unknown } = { current: null };

vi.mock("../hooks/useAdminMonitoringSubscriptions", () => ({
  useMonitoringSubscriptions: (filters: unknown) => {
    lastFiltersArg.current = filters;
    return subscriptionsState.current;
  },
}));

vi.mock("@/hooks/useFormatPrice", () => ({
  useFormatPrice: (amount: number, sourceCurrency: string) => ({
    formatted: `$${Number(amount).toFixed(2)}`,
    displayAmount: amount,
    displayCurrency: sourceCurrency,
    isLoading: false,
    fallback: false,
    rate: 1,
  }),
}));

// ─── SUT ─────────────────────────────────────────────────────────────

import AdminMonitoringSubscriptions from "./AdminMonitoringSubscriptions";

// ─── Test scaffolding ────────────────────────────────────────────────

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminMonitoringSubscriptions />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const mkSubscription = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 1,
  tenant_id: "ten-1",
  tenant_name: "Acme Co",
  tier: "standard",
  status: "active",
  monthly_cost_usd: 30,
  currency: "USD",
  host_count: 3,
  external_service_id: "ext-abc",
  last_run_status: "success",
  created_at: "2026-05-20T10:00:00Z",
  ...overrides,
});

beforeEach(() => {
  navigateMock.mockReset();
  lastFiltersArg.current = null;
  subscriptionsState.current = {
    data: {
      data: [mkSubscription(), mkSubscription({ id: 2, tenant_name: "Beta Inc", tier: "professional", host_count: 8, monthly_cost_usd: 200 })],
      meta: { current_page: 1, last_page: 2, total: 12 },
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
  };
});

// ─── Tests ───────────────────────────────────────────────────────────

describe("AdminMonitoringSubscriptions — rendering", () => {
  it("renders the paginated subscription list with tenant, tier, status and cost", () => {
    renderPage();

    expect(screen.getByText("Acme Co")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
    // Tier labels also appear in the filter <option> list; assert the
    // row chip via getAllByText length.
    expect(screen.getAllByText("Standard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Professional").length).toBeGreaterThan(0);
    expect(screen.getByText("$30.00")).toBeInTheDocument();
    expect(screen.getByText("$200.00")).toBeInTheDocument();
  });

  it("renders an empty info callout when no subscriptions match", () => {
    subscriptionsState.current = {
      data: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    };

    renderPage();

    expect(screen.getByText(/No subscriptions found/i)).toBeInTheDocument();
  });

  it("renders a loading state while the query is pending", () => {
    subscriptionsState.current = {
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      error: null,
    };

    renderPage();

    expect(screen.getByText(/Loading subscriptions/i)).toBeInTheDocument();
  });

  it("renders an error callout when the query fails", () => {
    subscriptionsState.current = {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error("network down"),
    };

    renderPage();

    expect(screen.getByText(/Unable to load subscriptions/i)).toBeInTheDocument();
    expect(screen.getByText(/network down/i)).toBeInTheDocument();
  });
});

describe("AdminMonitoringSubscriptions — filters", () => {
  it("changing the tier filter passes it through to the hook and resets to page 1", async () => {
    renderPage();

    const tierSelect = screen.getByLabelText(/^Tier$/i) as HTMLSelectElement;
    fireEvent.change(tierSelect, { target: { value: "enterprise" } });

    await waitFor(() => {
      const f = lastFiltersArg.current as { tier?: string; page?: number };
      expect(f.tier).toBe("enterprise");
      expect(f.page).toBe(1);
    });
  });

  it("changing the status filter passes it through to the hook", async () => {
    renderPage();

    const statusSelect = screen.getByLabelText(/^Status$/i) as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: "suspended" } });

    await waitFor(() => {
      const f = lastFiltersArg.current as { status?: string };
      expect(f.status).toBe("suspended");
    });
  });

  it("changing the CuberWatch-org filter passes a boolean through to the hook", async () => {
    renderPage();

    const orgSelect = screen.getByLabelText(/CuberWatch organisation/i) as HTMLSelectElement;
    fireEvent.change(orgSelect, { target: { value: "yes" } });

    await waitFor(() => {
      const f = lastFiltersArg.current as { has_cuberwatch_org?: boolean };
      expect(f.has_cuberwatch_org).toBe(true);
    });

    fireEvent.change(orgSelect, { target: { value: "no" } });
    await waitFor(() => {
      const f = lastFiltersArg.current as { has_cuberwatch_org?: boolean };
      expect(f.has_cuberwatch_org).toBe(false);
    });
  });
});

describe("AdminMonitoringSubscriptions — navigation", () => {
  it("clicking a row navigates to the subscription detail page", () => {
    renderPage();

    const row = screen
      .getByText("Acme Co")
      .closest("tr") as HTMLTableRowElement;
    expect(row).toBeTruthy();
    fireEvent.click(row);

    expect(navigateMock).toHaveBeenCalledWith(
      "/admin-dashboard/monitoring/subscriptions/1",
    );
  });
});
