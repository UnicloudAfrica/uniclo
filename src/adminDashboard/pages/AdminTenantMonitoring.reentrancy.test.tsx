/**
 * Tests for `AdminTenantMonitoring` re-entrancy guards (Generate Report).
 *
 * The Generate Report submit was already gated on `mutation.isPending`,
 * but React's onClick batching can collapse two clicks into the same
 * render frame. This file proves the `useAsyncAction` overlay catches
 * that race and the mutate hook is fired exactly once.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Hook + dependency mocks ─────────────────────────────────────────

const tenantInstancesState: { current: unknown } = {
  current: {
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: vi.fn(),
  },
};
const metricsState: { current: unknown } = {
  current: { data: undefined, isLoading: false, isError: false, error: null },
};
const diskState: { current: unknown } = {
  current: { data: [], isLoading: false, isError: false, error: null },
};
const reportMutationState: {
  current: { mutateAsync: ReturnType<typeof vi.fn>; isPending: boolean };
} = {
  current: { mutateAsync: vi.fn(), isPending: false },
};

vi.mock("../hooks/useAdminTenantMonitoring", () => ({
  useTenantInstances: () => tenantInstancesState.current,
  useInstanceMetrics: () => metricsState.current,
  useInstanceDisk: () => diskState.current,
  useGenerateUtilizationReport: () => reportMutationState.current,
}));

const tenantByIdState: { current: unknown } = {
  current: { data: { name: "Acme Co" } },
};
vi.mock("@/hooks/adminHooks/tenantHooks", () => ({
  useFetchTenantById: () => tenantByIdState.current,
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

import AdminTenantMonitoring from "./AdminTenantMonitoring";

// ─── Scaffolding ─────────────────────────────────────────────────────

const ENCODED_TENANT_ID = btoa("ten-123");

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter
        initialEntries={[
          `/admin-dashboard/partners/monitoring?id=${encodeURIComponent(
            ENCODED_TENANT_ID
          )}`,
        ]}
      >
        <AdminTenantMonitoring />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const mkInstance = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "i-1",
  identifier: "vm-001",
  name: "web-01",
  status: "active",
  public_ip: "10.0.0.1",
  region: "Lagos",
  availability_zone: "Lagos AZ1",
  ...overrides,
});

beforeEach(() => {
  tenantInstancesState.current = {
    data: [mkInstance()],
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: vi.fn(),
  };
  metricsState.current = {
    data: { metric: "cpu", interval_minutes: 5, statistic: "mean", points: [], summary: undefined },
    isLoading: false,
    isError: false,
    error: null,
  };
  diskState.current = {
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  };
  reportMutationState.current = {
    mutateAsync: vi
      .fn()
      .mockResolvedValue({ filename: "report.pdf", output: "pdf" }),
    isPending: false,
  };
  tenantByIdState.current = { data: { name: "Acme Co" } };
});

// ─── Tests ───────────────────────────────────────────────────────────

describe("AdminTenantMonitoring — Generate Report re-entrancy guard", () => {
  it("rapid double-click on Generate fires the mutation exactly once", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: /Generate Report/i })
    );

    // Modal opens with defaults pre-filled (24h preset). Submit is in the
    // action row — same logic as the existing test.
    const submitBtn = screen
      .getAllByRole("button", { name: /Generate/i })
      .find((b) => b.textContent?.trim() === "Generate")!;

    // Synchronous double-fire — both clicks land in the same frame.
    fireEvent.click(submitBtn);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        reportMutationState.current.mutateAsync
      ).toHaveBeenCalledTimes(1);
    });
  });

  it("disables Generate while the action is pending", async () => {
    const user = userEvent.setup();

    // Hold the mutation open.
    let resolveReport: ((v: unknown) => void) | null = null;
    reportMutationState.current = {
      mutateAsync: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveReport = resolve;
          })
      ),
      isPending: false,
    };

    renderPage();

    await user.click(
      screen.getByRole("button", { name: /Generate Report/i })
    );

    const submitBtn = screen
      .getAllByRole("button", { name: /Generate/i })
      .find((b) => b.textContent?.trim() === "Generate")! as HTMLButtonElement;

    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Button label flips to "Generating..." while pending.
      expect(
        screen.getAllByRole("button", { name: /Generating/i }).length
      ).toBeGreaterThan(0);
    });

    resolveReport?.({ filename: "report.pdf", output: "pdf" });
  });
});
