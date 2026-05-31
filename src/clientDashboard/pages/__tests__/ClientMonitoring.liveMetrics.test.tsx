/**
 * Smoke tests for the live-metric gauges on the client monitoring page.
 *
 * Gauges render in each VM card's footer via the shared
 * `InstanceLiveMetricsPanel`: 4 `Gauge`s (role="meter") when the BE reports
 * live metrics, or an honest "Not reporting" placeholder when
 * `source === "none"`.
 *
 * `useClientMonitoring` is stubbed to supply one monitored instance. The
 * metrics path (apiRegistry.silentApi.get → useInstanceLiveMetrics → panel)
 * runs for real so the producer↔consumer contract is exercised end-to-end.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";

// ── Mocks ────────────────────────────────────────────────────────────

const mockGet = vi.fn();

vi.mock("@/hooks/useApiContext", () => ({
  useApiContext: () => ({ context: "client" }),
}));

vi.mock("@/shared/api/apiRegistry", () => ({
  apiRegistry: {
    client: {
      silentApi: { get: (...args: unknown[]) => mockGet(...args) },
      urlPrefix: "/business",
    },
  },
}));

const monitoringState: { current: unknown } = { current: undefined };

vi.mock("@/hooks/clientHooks/clientMonitoringHooks", () => ({
  useClientMonitoring: () => monitoringState.current,
}));

import ClientMonitoring from "../ClientMonitoring";

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

const oneInstance = {
  data: {
    instances: [
      {
        id: 7,
        name: "db-primary",
        ip_address: "10.0.0.7",
        monitoring: {
          status: "active",
          last_seen_at: "2026-05-29T01:00:00Z",
          requires_operator_install: false,
          install_command: null,
          latest_metrics: null,
        },
      },
    ],
  },
  isLoading: false,
};

beforeEach(() => {
  mockGet.mockReset();
  monitoringState.current = oneInstance;
});

// ── Tests ────────────────────────────────────────────────────────────

describe("ClientMonitoring — live metric gauges", () => {
  it("renders four gauges in the card footer when metrics are present", async () => {
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

    renderPage(<ClientMonitoring />);

    await waitFor(() => {
      // CPU / Memory / Disk / Network → 4 meters.
      expect(screen.getAllByRole("meter")).toHaveLength(4);
    });
    // Network throughput shown as real Mbps text, never a fabricated percent.
    expect(screen.getByText("2.3 Mbps")).toBeInTheDocument();
  });

  it("renders the honest empty-state when source === 'none'", async () => {
    mockGet.mockResolvedValue({
      success: true,
      metrics: null,
      source: "none",
      message: "No live metrics yet — instance is not reporting to monitoring.",
    });

    renderPage(<ClientMonitoring />);

    await waitFor(() => {
      expect(screen.getByText(/Not reporting to monitoring yet/i)).toBeInTheDocument();
    });
    // No gauges fabricated for a non-reporting host.
    expect(screen.queryAllByRole("meter")).toHaveLength(0);
  });
});
