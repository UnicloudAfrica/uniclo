/**
 * Smoke tests for the live-metric gauges on the tenant monitoring page.
 *
 * The gauges live in an expandable row: expand a host, then the shared
 * `InstanceLiveMetricsPanel` renders 4 `Gauge`s (role="meter") when the BE
 * reports live metrics, or an honest "Not reporting" placeholder when
 * `source === "none"`.
 *
 * `useTenantMonitoring` is stubbed to supply one host row. The metrics path
 * (apiRegistry.silentApi.get → useInstanceLiveMetrics → panel) runs for real
 * so the producer↔consumer contract is exercised end-to-end.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";

// ModernTable's row-animation hook (`useAnimations`) uses IntersectionObserver,
// which jsdom doesn't ship. A no-op stub keeps the table mount from crashing.
if (typeof globalThis.IntersectionObserver === "undefined") {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IntersectionObserver = IO;
}

// ── Mocks ────────────────────────────────────────────────────────────

const mockGet = vi.fn();

vi.mock("@/hooks/useApiContext", () => ({
  useApiContext: () => ({ context: "tenant" }),
}));

vi.mock("@/shared/api/apiRegistry", () => ({
  apiRegistry: {
    tenant: { silentApi: { get: (...args: unknown[]) => mockGet(...args) }, urlPrefix: "/admin" },
  },
}));

const monitoringState: { current: unknown } = { current: undefined };

vi.mock("../../hooks/useTenantMonitoring", () => ({
  useTenantMonitoring: () => monitoringState.current,
}));

import TenantMonitoring from "../TenantMonitoring";

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

const oneHost = {
  data: {
    subscription: {
      plan: "standard",
      host_count: 1,
      host_limit: 5,
      currency: "USD",
      price_per_host: 0,
      monthly_cost: 0,
      hasActivePlan: true,
    },
    hosts: [
      {
        id: 42,
        name: "web-01",
        ip: "10.0.0.1",
        rawStatus: "connected",
        status: "connected",
        last_seen_at: "2026-05-29T01:00:00Z",
        requires_operator_install: false,
        install_command: null,
      },
    ],
  },
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
};

beforeEach(() => {
  mockGet.mockReset();
  monitoringState.current = oneHost;
});

// ── Tests ────────────────────────────────────────────────────────────

describe("TenantMonitoring — live metric gauges", () => {
  it("renders four gauges in the expanded row when metrics are present", async () => {
    mockGet.mockResolvedValue({
      success: true,
      metrics: {
        cpu_percent: 4.12,
        memory_percent: 35.2,
        disk_percent: 11.0,
        network_in_mbps: 1.5,
        network_out_mbps: 0.8,
        collected_at: "2026-05-29T01:00:00Z",
      },
      source: "cuberwatch",
    });

    renderPage(<TenantMonitoring />);

    // Expand the host row — the chevron toggle is the row's icon-only button.
    const row = screen.getByText("web-01").closest("tr")!;
    const toggle = row.querySelector("button")!;
    fireEvent.click(toggle);

    await waitFor(() => {
      // CPU / Memory / Disk / Network → 4 meters.
      expect(screen.getAllByRole("meter")).toHaveLength(4);
    });
    // Network throughput is rendered as real Mbps text, not a fake percent.
    expect(screen.getByText("2.3 Mbps")).toBeInTheDocument();
  });

  it("renders the honest empty-state when source === 'none'", async () => {
    mockGet.mockResolvedValue({
      success: true,
      metrics: null,
      source: "none",
      message: "No live metrics yet — instance is not reporting to monitoring.",
    });

    renderPage(<TenantMonitoring />);

    const row = screen.getByText("web-01").closest("tr")!;
    const toggle = row.querySelector("button")!;
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText(/Not reporting to monitoring yet/i)).toBeInTheDocument();
    });
    // No gauges fabricated for a non-reporting host.
    expect(screen.queryAllByRole("meter")).toHaveLength(0);
  });
});
