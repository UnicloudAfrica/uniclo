/**
 * Tests for `AdminTenantReportSubscriptions` (Stream A, task A4).
 *
 * Mocks the data layer at module boundary so the assertions exercise
 * rendering + interaction logic without touching `fetch` or `silentApi`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Hook + dependency mocks ─────────────────────────────────────────

type MutationStub = {
  mutateAsync: ReturnType<typeof vi.fn>;
  isPending: boolean;
};

const listState: { current: unknown } = {
  current: {
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: vi.fn(),
  },
};
const createMutationState: { current: MutationStub } = {
  current: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
};
const updateMutationState: { current: MutationStub } = {
  current: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
};
const deleteMutationState: { current: MutationStub } = {
  current: { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false },
};

vi.mock("../hooks/useReportSubscriptions", async () => {
  // Pull the real `COMMON_TIMEZONES` constant through so the form's
  // timezone picker doesn't break.
  const actual = await vi.importActual<typeof import("../hooks/useReportSubscriptions")>(
    "../hooks/useReportSubscriptions"
  );
  return {
    ...actual,
    useReportSubscriptions: () => listState.current,
    useCreateReportSubscription: () => createMutationState.current,
    useUpdateReportSubscription: () => updateMutationState.current,
    useDeleteReportSubscription: () => deleteMutationState.current,
  };
});

const tenantByIdState: { current: unknown } = {
  current: { data: { name: "Acme Co" } },
};
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

import AdminTenantReportSubscriptions from "./AdminTenantReportSubscriptions";
import type { ReportSubscription } from "../hooks/useReportSubscriptions";

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
      <MemoryRouter
        initialEntries={[
          `/admin-dashboard/partners/report-subscriptions?id=${encodeURIComponent(ENCODED_TENANT_ID)}`,
        ]}
      >
        <AdminTenantReportSubscriptions />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const mkSubscription = (
  overrides: Partial<ReportSubscription> = {}
): ReportSubscription => ({
  id: 1,
  cadence: "weekly",
  output: "pdf",
  recipients: ["alice@example.com", "bob@example.com"],
  enabled: true,
  day_of_week: 1, // Monday
  day_of_month: null,
  hour_of_day: 9,
  timezone: "UTC",
  next_run_at: "2026-06-01T09:00:00Z",
  last_run_at: "2026-05-25T09:00:00Z",
  last_run_status: "success",
  ...overrides,
});

beforeEach(() => {
  listState.current = {
    data: [mkSubscription()],
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: vi.fn(),
  };
  createMutationState.current = {
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  };
  updateMutationState.current = {
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  };
  deleteMutationState.current = {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  };
  tenantByIdState.current = { data: { name: "Acme Co" } };
  toastSuccess.mockReset();
  toastError.mockReset();
});

// ─── Tests ───────────────────────────────────────────────────────────

describe("AdminTenantReportSubscriptions — rendering", () => {
  it("renders the tenant name, breadcrumb to monitoring, and the subscription row", () => {
    renderPage();

    expect(screen.getAllByText(/Acme Co/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Weekly on Monday at 09:00 UTC/i)).toBeInTheDocument();
    expect(screen.getByText(/alice@example.com/)).toBeInTheDocument();
    // Breadcrumb back to the monitoring page
    expect(screen.getByRole("button", { name: /Back to monitoring/i })).toBeInTheDocument();
  });

  it("renders the empty state when there are no subscriptions", () => {
    listState.current = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    };

    renderPage();

    expect(
      screen.getByText(/No scheduled reports for this tenant yet/i)
    ).toBeInTheDocument();
  });

  it("renders the loading state while subscriptions are pending", () => {
    listState.current = {
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      isFetching: true,
      refetch: vi.fn(),
    };

    renderPage();

    expect(screen.getByText(/Loading scheduled reports/i)).toBeInTheDocument();
  });

  it("fires an error toast and renders an error callout when the list errors", async () => {
    listState.current = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Tenant 'ten-123' not found."),
      isFetching: false,
      refetch: vi.fn(),
    };

    renderPage();

    expect(screen.getByText(/Unable to load scheduled reports/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Tenant 'ten-123' not found.")
    );
  });

  it("renders the 'Missing tenant ID' state when ?id is absent", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/admin-dashboard/partners/report-subscriptions`]}>
          <AdminTenantReportSubscriptions />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Missing tenant ID/i)).toBeInTheDocument();
  });
});

describe("AdminTenantReportSubscriptions — create flow", () => {
  it("opens the form, submits a valid payload, and fires the create hook", async () => {
    const user = userEvent.setup();
    listState.current = {
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    };
    renderPage();

    await user.click(screen.getByRole("button", { name: /Add subscription/i }));

    // Modal opens — assert via its unique subtitle copy.
    expect(
      await screen.findByText(/Schedule a recurring utilization report/i)
    ).toBeInTheDocument();

    // Default cadence is daily; add one recipient + click Create.
    const recipientInput = screen.getByPlaceholderText(/name@example.com/i);
    await user.type(recipientInput, "ops@example.com");
    await user.click(screen.getByRole("button", { name: /^Add$/ }));

    expect(screen.getByText("ops@example.com")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Create subscription/i })
    );

    await waitFor(() => {
      expect(createMutationState.current.mutateAsync).toHaveBeenCalledTimes(1);
    });

    const payload = createMutationState.current.mutateAsync.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      cadence: "daily",
      output: "pdf",
      recipients: ["ops@example.com"],
      enabled: true,
      hour_of_day: 9,
      timezone: "UTC",
      day_of_week: null,
      day_of_month: null,
    });

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Subscription created.")
    );
  });

  it("rejects with a validation message when recipients is empty", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Add subscription/i }));
    await user.click(
      screen.getByRole("button", { name: /Create subscription/i })
    );

    expect(
      await screen.findByText(/Add at least one recipient/i)
    ).toBeInTheDocument();
    expect(createMutationState.current.mutateAsync).not.toHaveBeenCalled();
  });

  it("rejects an invalid email at the add-recipient stage", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Add subscription/i }));
    const recipientInput = screen.getByPlaceholderText(/name@example.com/i);
    await user.type(recipientInput, "not-an-email");
    await user.click(screen.getByRole("button", { name: /^Add$/ }));

    expect(
      await screen.findByText(/Enter a valid email address/i)
    ).toBeInTheDocument();
  });

  it("requires day_of_week when cadence is weekly", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Add subscription/i }));

    // Switch cadence to weekly — the day-of-week select becomes visible.
    const cadence = screen.getByLabelText(/^Cadence$/i) as HTMLSelectElement;
    await user.selectOptions(cadence, "weekly");

    const dow = (await screen.findByLabelText(/Day of week/i)) as HTMLSelectElement;
    expect(dow).toBeInTheDocument();
    // Default is Monday ("1") — verify the form sends it.
    expect(dow.value).toBe("1");

    // Provide a recipient so we get past the recipients gate.
    const recipientInput = screen.getByPlaceholderText(/name@example.com/i);
    await user.type(recipientInput, "ops@example.com");
    await user.click(screen.getByRole("button", { name: /^Add$/ }));

    await user.click(
      screen.getByRole("button", { name: /Create subscription/i })
    );

    await waitFor(() => {
      expect(createMutationState.current.mutateAsync).toHaveBeenCalledTimes(1);
    });
    const payload = createMutationState.current.mutateAsync.mock.calls[0]?.[0];
    expect(payload.cadence).toBe("weekly");
    expect(payload.day_of_week).toBe(1);
    expect(payload.day_of_month).toBeNull();
  });

  it("rejects day_of_month outside 1–28 for monthly cadence", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Add subscription/i }));

    const cadence = screen.getByLabelText(/^Cadence$/i) as HTMLSelectElement;
    await user.selectOptions(cadence, "monthly");

    const dom = (await screen.findByLabelText(/Day of month/i)) as HTMLInputElement;
    await user.clear(dom);
    await user.type(dom, "31");

    // Provide a recipient so the validation path reaches dayOfMonth.
    const recipientInput = screen.getByPlaceholderText(/name@example.com/i);
    await user.type(recipientInput, "ops@example.com");
    await user.click(screen.getByRole("button", { name: /^Add$/ }));

    await user.click(
      screen.getByRole("button", { name: /Create subscription/i })
    );

    expect(
      await screen.findByText(/Day must be between 1 and 28/i)
    ).toBeInTheDocument();
    expect(createMutationState.current.mutateAsync).not.toHaveBeenCalled();
  });

  it("rejects hour_of_day outside 0–23", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Add subscription/i }));

    const hour = screen.getByLabelText(/Hour of day/i) as HTMLInputElement;
    await user.clear(hour);
    await user.type(hour, "24");

    const recipientInput = screen.getByPlaceholderText(/name@example.com/i);
    await user.type(recipientInput, "ops@example.com");
    await user.click(screen.getByRole("button", { name: /^Add$/ }));

    await user.click(
      screen.getByRole("button", { name: /Create subscription/i })
    );

    expect(
      await screen.findByText(/Hour must be between 0 and 23/i)
    ).toBeInTheDocument();
    expect(createMutationState.current.mutateAsync).not.toHaveBeenCalled();
  });

  it("surfaces an error toast when the create hook rejects", async () => {
    const user = userEvent.setup();
    createMutationState.current = {
      mutateAsync: vi.fn().mockRejectedValue(new Error("Backend exploded")),
      isPending: false,
    };
    renderPage();

    await user.click(screen.getByRole("button", { name: /Add subscription/i }));
    const recipientInput = screen.getByPlaceholderText(/name@example.com/i);
    await user.type(recipientInput, "ops@example.com");
    await user.click(screen.getByRole("button", { name: /^Add$/ }));
    await user.click(
      screen.getByRole("button", { name: /Create subscription/i })
    );

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Backend exploded")
    );
  });
});

describe("AdminTenantReportSubscriptions — edit flow", () => {
  it("opens the modal pre-filled with subscription values and submits an update", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Edit subscription 1/i }));

    // Modal shows existing values.
    expect(await screen.findByText(/Edit subscription/i)).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    const cadence = screen.getByLabelText(/^Cadence$/i) as HTMLSelectElement;
    expect(cadence.value).toBe("weekly");

    // Switch output to CSV and save.
    const output = screen.getByLabelText(/Output format/i) as HTMLSelectElement;
    await user.selectOptions(output, "csv");

    await user.click(screen.getByRole("button", { name: /Save changes/i }));

    await waitFor(() =>
      expect(updateMutationState.current.mutateAsync).toHaveBeenCalledTimes(1)
    );
    const payload = updateMutationState.current.mutateAsync.mock.calls[0]?.[0];
    expect(payload).toMatchObject({
      cadence: "weekly",
      output: "csv",
      recipients: ["alice@example.com", "bob@example.com"],
      hour_of_day: 9,
      timezone: "UTC",
      day_of_week: 1,
      day_of_month: null,
    });
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Subscription updated.")
    );
  });
});

describe("AdminTenantReportSubscriptions — delete flow", () => {
  it("prompts for confirmation, then calls the delete hook", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Delete subscription 1/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Delete subscription\?/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /^Delete$/ }));

    await waitFor(() =>
      expect(deleteMutationState.current.mutateAsync).toHaveBeenCalledTimes(1)
    );
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Subscription deleted.")
    );
  });

  it("does not call delete when the user cancels", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Delete subscription 1/i }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /Cancel/i }));

    expect(deleteMutationState.current.mutateAsync).not.toHaveBeenCalled();
  });
});

describe("AdminTenantReportSubscriptions — inline enabled toggle", () => {
  it("flips enabled via the update hook with the new boolean", async () => {
    const user = userEvent.setup();
    renderPage();

    // The subscription starts enabled — toggling off sends { enabled: false }.
    const toggle = screen.getByLabelText(/Disable subscription 1/i) as HTMLInputElement;
    expect(toggle.checked).toBe(true);

    await user.click(toggle);

    await waitFor(() =>
      expect(updateMutationState.current.mutateAsync).toHaveBeenCalledTimes(1)
    );
    expect(updateMutationState.current.mutateAsync).toHaveBeenCalledWith({
      enabled: false,
    });
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Subscription paused.")
    );
  });
});
