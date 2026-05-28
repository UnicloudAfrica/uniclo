/**
 * Smoke test for `TenantMonitoring` page.
 *
 * Mocks `useTenantMonitoring` at the module boundary so we exercise the
 * page's rendering paths (loading / error / empty / populated + install
 * command modal) without touching the real network layer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent } from "@testing-library/react";

// jsdom doesn't ship IntersectionObserver / matchMedia, but ModernTable's
// `useAnimations` hook reaches for both. No-op stubs keep mount from crashing.
if (typeof globalThis.IntersectionObserver === "undefined") {
  class StubIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IntersectionObserver = StubIntersectionObserver;
}
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

// ─── Hook + dependency mocks ─────────────────────────────────────────

type HookResult = {
  data: {
    subscription: {
      plan: string;
      host_count: number;
      host_limit: number;
      currency: string;
      price_per_host: number;
      monthly_cost: number;
      hasActivePlan: boolean;
    };
    hosts: Array<{
      id: number;
      name: string;
      ip: string | null;
      status: "pending" | "connected" | "disconnected" | "unknown";
      rawStatus: string;
      last_seen_at: string | null;
      requires_operator_install: boolean;
      install_command: string | null;
    }>;
  } | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

const hookState: { current: HookResult } = {
  current: {
    data: null,
    isLoading: true,
    isError: false,
    error: null,
    refetch: vi.fn(),
  },
};

vi.mock("../hooks/useTenantMonitoring", () => ({
  useTenantMonitoring: () => hookState.current,
}));

vi.mock("@/hooks/useFormatPrice", () => ({
  useFormatPrice: (amount: number, sourceCurrency: string) => ({
    formatted: `${sourceCurrency} ${Number(amount).toFixed(2)}`,
    displayAmount: amount,
    displayCurrency: sourceCurrency,
    isLoading: false,
    fallback: false,
    rate: 1,
  }),
}));

vi.mock("@/utils/toastUtil", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// ─── SUT ─────────────────────────────────────────────────────────────

import TenantMonitoring from "./TenantMonitoring";

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/dashboard/monitoring"]}>
        <TenantMonitoring />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const mkData = (overrides: Partial<HookResult["data"]> = {}) => ({
  subscription: {
    plan: "standard",
    host_count: 2,
    host_limit: 10,
    currency: "USD",
    price_per_host: 5,
    monthly_cost: 10,
    hasActivePlan: true,
  },
  hosts: [
    {
      id: 1,
      name: "web-01",
      ip: "10.0.0.1",
      status: "connected" as const,
      rawStatus: "running",
      last_seen_at: "2026-05-27T10:00:00Z",
      requires_operator_install: false,
      install_command: null,
    },
    {
      id: 2,
      name: "db-01",
      ip: "10.0.0.2",
      status: "pending" as const,
      rawStatus: "pending",
      last_seen_at: null,
      requires_operator_install: true,
      install_command:
        "curl -fsSL https://cuberwatch.example/install.sh | sudo bash -s -- --token=abc",
    },
  ],
  ...overrides,
});

beforeEach(() => {
  hookState.current = {
    data: mkData(),
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
});

// ─── Tests ───────────────────────────────────────────────────────────

describe("TenantMonitoring", () => {
  it("renders the loading state while the hook is still fetching", () => {
    hookState.current = {
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
    renderPage();
    expect(screen.getByText(/Loading monitoring subscription/i)).toBeTruthy();
  });

  it("renders the error state with a retry button when the hook errors", () => {
    hookState.current = {
      data: null,
      isLoading: false,
      isError: true,
      error: new Error("Network down"),
      refetch: vi.fn(),
    };
    renderPage();
    expect(screen.getByText(/Unable to load monitoring/i)).toBeTruthy();
    expect(screen.getByText(/Network down/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeTruthy();
  });

  it("renders the empty state when no hosts are attached", () => {
    hookState.current = {
      data: mkData({ hosts: [] }),
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
    renderPage();
    expect(
      screen.getByText(/No monitored hosts yet\. Provision a VM/i),
    ).toBeTruthy();
  });

  it("renders the subscription summary and host rows", () => {
    renderPage();

    // Header text from TenantPageShell
    expect(screen.getAllByText(/Monitoring/i).length).toBeGreaterThan(0);

    // Subscription plan in hero
    expect(screen.getByText(/Standard plan/i)).toBeTruthy();

    // Host row data
    expect(screen.getByText("web-01")).toBeTruthy();
    expect(screen.getByText("db-01")).toBeTruthy();
    expect(screen.getByText("10.0.0.1")).toBeTruthy();
  });

  it("opens the install command modal for hosts pending operator install", () => {
    renderPage();

    // Only the pending host should expose the "Install command" button.
    const installBtns = screen.getAllByRole("button", {
      name: /Install command/i,
    });
    expect(installBtns).toHaveLength(1);

    fireEvent.click(installBtns[0]);

    // Modal opens with the persisted command + the warning copy.
    expect(
      screen.getByText(/Install monitoring agent on db-01/i),
    ).toBeTruthy();
    expect(screen.getByText(/Run on the target VM only/i)).toBeTruthy();
    expect(
      screen.getByText(/cuberwatch\.example\/install\.sh/i),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Copy install command/i })).toBeTruthy();
  });
});
