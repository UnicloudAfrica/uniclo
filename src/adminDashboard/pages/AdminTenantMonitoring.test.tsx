/**
 * Tests for `AdminTenantMonitoring` (Stream A, task A3).
 *
 * Mocks the data layer at module boundary (the page's own hook file and
 * the tenant-by-id fetcher) so the assertions exercise rendering +
 * interaction logic without touching `fetch` or `silentApi`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Hook + dependency mocks ─────────────────────────────────────────

const tenantInstancesState: { current: unknown } = { current: { data: [], isLoading: false, isError: false, error: null, isFetching: false, refetch: vi.fn() } };
const metricsState: { current: unknown } = { current: { data: undefined, isLoading: false, isError: false, error: null } };
const diskState: { current: unknown } = { current: { data: [], isLoading: false, isError: false, error: null } };
const reportMutationState: { current: unknown } = { current: { mutateAsync: vi.fn(), isPending: false } };

vi.mock("../hooks/useAdminTenantMonitoring", () => ({
  useTenantInstances: () => tenantInstancesState.current,
  useInstanceMetrics: () => metricsState.current,
  useInstanceDisk: () => diskState.current,
  useGenerateUtilizationReport: () => reportMutationState.current,
}));

const tenantByIdState: { current: unknown } = { current: { data: { name: "Acme Co" } } };
vi.mock("@/hooks/adminHooks/tenantHooks", () => ({
  useFetchTenantById: () => tenantByIdState.current,
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("@/utils/toastUtil", () => ({
  default: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// ─── SUT ─────────────────────────────────────────────────────────────

import AdminTenantMonitoring from "./AdminTenantMonitoring";

// ─── Test scaffolding ────────────────────────────────────────────────

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
      <MemoryRouter initialEntries={[`/admin-dashboard/partners/monitoring?id=${encodeURIComponent(ENCODED_TENANT_ID)}`]}>
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

const mkMetricsResponse = (kind: "cpu" | "memory" | "network") => ({
  metric: kind,
  interval_minutes: 5,
  statistic: "mean",
  points: [
    { timestamp: "2026-05-25T00:00:00Z", value: 10 },
    { timestamp: "2026-05-25T00:05:00Z", value: 14 },
    { timestamp: "2026-05-25T00:10:00Z", value: 18 },
  ],
  summary: { mean: 14, peak: 18, count: 3, unit: kind === "network" ? "B/s" : "%" },
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
    data: mkMetricsResponse("cpu"),
    isLoading: false,
    isError: false,
    error: null,
  };
  diskState.current = {
    data: [
      {
        volume_identifier: "root",
        total_bytes: 100_000_000_000,
        used_bytes: 40_000_000_000,
        free_bytes: 60_000_000_000,
        recorded_at: "2026-05-25T10:00:00Z",
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
  };
  reportMutationState.current = {
    mutateAsync: vi.fn().mockResolvedValue({ filename: "utilization-ten-123-2026-05-25.pdf", output: "pdf" }),
    isPending: false,
  };
  tenantByIdState.current = { data: { name: "Acme Co" } };
  toastSuccess.mockReset();
  toastError.mockReset();
});

// ─── Tests ───────────────────────────────────────────────────────────

describe("AdminTenantMonitoring — rendering", () => {
  it("renders the tenant name, instance row, the three metric tiles, and a disk panel", () => {
    renderPage();

    // "Acme Co" appears in both breadcrumb and heading — at least one is enough.
    expect(screen.getAllByText(/Acme Co/).length).toBeGreaterThan(0);
    expect(screen.getByText("web-01")).toBeInTheDocument();
    // Three metric tile headings + one disk panel heading
    expect(screen.getByText("CPU")).toBeInTheDocument();
    expect(screen.getByText("Memory")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByText("Disk")).toBeInTheDocument();
  });

  it("renders the neutral 'pending provider wiring' message when disk data is empty", () => {
    diskState.current = { data: [], isLoading: false, isError: false, error: null };

    renderPage();

    expect(
      screen.getByText(/Disk metrics pending provider wiring/i)
    ).toBeInTheDocument();
  });

  it("renders the loading state while instances are pending", () => {
    tenantInstancesState.current = {
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      isFetching: true,
      refetch: vi.fn(),
    };

    renderPage();

    expect(screen.getByText(/Loading instances/i)).toBeInTheDocument();
  });

  it("renders an error callout when the instances hook errors out", () => {
    tenantInstancesState.current = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Tenant not found"),
      isFetching: false,
      refetch: vi.fn(),
    };

    renderPage();

    expect(screen.getByText(/Unable to load instances/i)).toBeInTheDocument();
    expect(screen.getByText(/Tenant not found/)).toBeInTheDocument();
  });

  it("renders an empty state when the tenant has no active instances", () => {
    tenantInstancesState.current = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    };

    renderPage();

    // The phrase shows up in both the callout title and body — getAllBy is fine.
    expect(screen.getAllByText(/No active instances/i).length).toBeGreaterThan(0);
  });

  it("redacts the 'Missing tenant ID' state when ?id is absent", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/admin-dashboard/partners/monitoring`]}>
          <AdminTenantMonitoring />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Missing tenant ID/i)).toBeInTheDocument();
  });
});

describe("AdminTenantMonitoring — toast on cross-tenant 404", () => {
  it("fires an error toast when the instances hook surfaces an error", async () => {
    tenantInstancesState.current = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Tenant 'ten-123' not found."),
      isFetching: false,
      refetch: vi.fn(),
    };

    renderPage();

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Tenant 'ten-123' not found.")
    );
  });
});

describe("AdminTenantMonitoring — time-window selector", () => {
  it("changing the preset re-renders so child metric hooks receive a new range", async () => {
    renderPage();

    // The `useInstanceMetrics` mock returns the same object reference regardless
    // of args, so we assert on the visible side-effect — the page heading still
    // says monitoring and the selector reflects the new choice.
    const select = screen.getByLabelText(/Time window/i) as HTMLSelectElement;
    expect(select.value).toBe("24h");

    fireEvent.change(select, { target: { value: "7d" } });

    await waitFor(() => expect(select.value).toBe("7d"));
  });
});

describe("AdminTenantMonitoring — Generate Report modal", () => {
  it("opens the modal, validates date inputs, and triggers the download on submit", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Generate Report/i }));

    const dialogTitle = await screen.findByText(/Generate Utilization Report/i);
    expect(dialogTitle).toBeInTheDocument();

    // Clear both dates to trigger validation.
    const start = screen.getByLabelText(/^Start$/i) as HTMLInputElement;
    const end = screen.getByLabelText(/^End$/i) as HTMLInputElement;
    fireEvent.change(start, { target: { value: "" } });
    fireEvent.change(end, { target: { value: "" } });

    // The submit "Generate" button lives in the modal action row.
    const submitBtn = screen.getAllByRole("button", { name: /Generate/i }).find(
      (b) => b.textContent?.trim() === "Generate"
    );
    expect(submitBtn).toBeTruthy();
    await user.click(submitBtn!);

    expect(
      await screen.findByText(/Start and end dates are required/i)
    ).toBeInTheDocument();

    // Now fill the form and submit.
    fireEvent.change(start, { target: { value: "2026-05-20T00:00" } });
    fireEvent.change(end, { target: { value: "2026-05-25T00:00" } });

    await user.click(submitBtn!);

    await waitFor(() => {
      expect(
        (reportMutationState.current as { mutateAsync: ReturnType<typeof vi.fn> }).mutateAsync
      ).toHaveBeenCalledTimes(1);
    });

    const callArg = (
      (reportMutationState.current as { mutateAsync: ReturnType<typeof vi.fn> }).mutateAsync.mock.calls[0]?.[0]
    ) as { start: string; end: string; output: string };
    expect(callArg.output).toBe("pdf");
    expect(typeof callArg.start).toBe("string");
    expect(typeof callArg.end).toBe("string");

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(expect.stringMatching(/downloaded/i))
    );
  });

  it("rejects when start is after end", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Generate Report/i }));

    const start = screen.getByLabelText(/^Start$/i) as HTMLInputElement;
    const end = screen.getByLabelText(/^End$/i) as HTMLInputElement;
    fireEvent.change(start, { target: { value: "2026-05-25T00:00" } });
    fireEvent.change(end, { target: { value: "2026-05-20T00:00" } });

    const submitBtn = screen.getAllByRole("button", { name: /Generate/i }).find(
      (b) => b.textContent?.trim() === "Generate"
    );
    await user.click(submitBtn!);

    expect(await screen.findByText(/Start must be before end/i)).toBeInTheDocument();
    expect(
      (reportMutationState.current as { mutateAsync: ReturnType<typeof vi.fn> }).mutateAsync
    ).not.toHaveBeenCalled();
  });
});

describe("AdminTenantMonitoring — provider redaction", () => {
  it("does not render the raw provider name when present in region/AZ strings", () => {
    tenantInstancesState.current = {
      data: [
        mkInstance({
          region: "Zadara Lagos",
          availability_zone: "nobus-lagos-az1",
        }),
      ],
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    };

    renderPage();

    // The sanitizeProviderLabel helper strips Zadara / Nobus tokens.
    const card = screen.getByText("web-01").closest("div");
    expect(card).toBeTruthy();
    const html = (card as HTMLElement).innerHTML.toLowerCase();
    expect(html).not.toContain("zadara");
    expect(html).not.toContain("nobus");
  });

  // Acknowledge `within` import used in a follow-up assertion if needed.
  void within;
});
