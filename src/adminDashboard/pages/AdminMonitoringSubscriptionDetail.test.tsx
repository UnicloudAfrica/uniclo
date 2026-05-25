/**
 * Tests for `AdminMonitoringSubscriptionDetail` (B7 frontend).
 *
 * Mocks the detail hook + router params to verify header rendering,
 * assigned hosts table, recent events list, and empty-state handling.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen } from "@testing-library/react";

// ─── Hook mocks ──────────────────────────────────────────────────────

const detailState: { current: unknown } = {
  current: { data: undefined, isLoading: false, isError: false, error: null },
};

vi.mock("../hooks/useAdminMonitoringSubscriptions", () => ({
  useMonitoringSubscriptionDetail: () => detailState.current,
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

import AdminMonitoringSubscriptionDetail from "./AdminMonitoringSubscriptionDetail";

// ─── Test scaffolding ────────────────────────────────────────────────

const renderPage = (id = "42") => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/admin-dashboard/monitoring/subscriptions/${id}`]}>
        <Routes>
          <Route
            path="/admin-dashboard/monitoring/subscriptions/:id"
            element={<AdminMonitoringSubscriptionDetail />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const mkDetail = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 42,
  tenant_id: "ten-42",
  tenant_name: "Acme Co",
  tier: "professional" as const,
  status: "active",
  monthly_cost_usd: 200,
  currency: "USD",
  host_count: 8,
  external_service_id: "svc-abc-123",
  last_run_status: "success",
  created_at: "2026-05-20T10:00:00Z",
  assigned_hosts: [
    {
      id: 101,
      identifier: "vm-001",
      name: "web-01",
      status: "active",
      added_at: "2026-05-20T11:00:00Z",
    },
    {
      id: 102,
      identifier: "vm-002",
      name: "db-01",
      status: "active",
      added_at: "2026-05-20T11:05:00Z",
    },
  ],
  recent_events: [
    {
      id: 1,
      type: "metric.collected",
      status: "success",
      message: "Collected 240 datapoints",
      occurred_at: "2026-05-25T01:00:00Z",
    },
    {
      id: 2,
      type: "alert.fired",
      status: "warning",
      message: "CPU saturated on vm-001",
      occurred_at: "2026-05-24T22:00:00Z",
    },
  ],
  ...overrides,
});

beforeEach(() => {
  detailState.current = {
    data: mkDetail(),
    isLoading: false,
    isError: false,
    error: null,
  };
});

// ─── Tests ───────────────────────────────────────────────────────────

describe("AdminMonitoringSubscriptionDetail — header", () => {
  it("renders the tenant name, tier, monthly cost, host count and external service id", () => {
    renderPage();

    expect(screen.getByText("Acme Co")).toBeInTheDocument();
    expect(screen.getAllByText(/Professional/i).length).toBeGreaterThan(0);
    expect(screen.getByText("$200.00")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getAllByText(/svc-abc-123/).length).toBeGreaterThan(0);
  });

  it("renders the loading state when the detail query is pending", () => {
    detailState.current = {
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    };

    renderPage();

    expect(screen.getByText(/Loading subscription/i)).toBeInTheDocument();
  });

  it("renders the error state when the detail query fails", () => {
    detailState.current = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Subscription not found."),
    };

    renderPage();

    expect(screen.getByText(/Unable to load subscription/i)).toBeInTheDocument();
    expect(screen.getByText(/Subscription not found/i)).toBeInTheDocument();
  });
});

describe("AdminMonitoringSubscriptionDetail — assigned hosts", () => {
  it("renders the assigned-hosts table with identifier + name", () => {
    renderPage();

    expect(screen.getByText("vm-001")).toBeInTheDocument();
    expect(screen.getByText("vm-002")).toBeInTheDocument();
    expect(screen.getByText("web-01")).toBeInTheDocument();
    expect(screen.getByText("db-01")).toBeInTheDocument();
  });

  it("renders an empty-state line when there are no assigned hosts", () => {
    detailState.current = {
      data: mkDetail({ assigned_hosts: [] }),
      isLoading: false,
      isError: false,
      error: null,
    };

    renderPage();

    expect(
      screen.getByText(/No hosts are currently assigned/i),
    ).toBeInTheDocument();
  });
});

describe("AdminMonitoringSubscriptionDetail — recent events", () => {
  it("renders each recent event row with its type and message", () => {
    renderPage();

    expect(screen.getByText("metric.collected")).toBeInTheDocument();
    expect(screen.getByText("alert.fired")).toBeInTheDocument();
    expect(screen.getByText(/Collected 240 datapoints/)).toBeInTheDocument();
    expect(screen.getByText(/CPU saturated on vm-001/)).toBeInTheDocument();
  });

  it("renders the empty placeholder when no events are present", () => {
    detailState.current = {
      data: mkDetail({ recent_events: [] }),
      isLoading: false,
      isError: false,
      error: null,
    };

    renderPage();

    expect(screen.getByText(/No events recorded yet/i)).toBeInTheDocument();
  });

  it("caps the rendered events at 50 when the API returns more", () => {
    const manyEvents = Array.from({ length: 60 }, (_, i) => ({
      id: i + 1,
      type: `event.${i + 1}`,
      status: "success",
      message: `event-${i + 1}`,
      occurred_at: "2026-05-25T00:00:00Z",
    }));

    detailState.current = {
      data: mkDetail({ recent_events: manyEvents }),
      isLoading: false,
      isError: false,
      error: null,
    };

    renderPage();

    expect(screen.getByText("event.50")).toBeInTheDocument();
    // event 51 (index 50) is sliced off.
    expect(screen.queryByText("event.51")).toBeNull();
  });
});
