/**
 * Tests for `AdminTenantReportSubscriptions` re-entrancy guards.
 *
 * Covers double-click protection on:
 *   - the Create subscription submit
 *   - the Edit subscription submit
 *   - the inline Enabled toggle
 *   - the Delete confirm
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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
  const actual = await vi.importActual<
    typeof import("../hooks/useReportSubscriptions")
  >("../hooks/useReportSubscriptions");
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

vi.mock("@/utils/toastUtil", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// ─── SUT ─────────────────────────────────────────────────────────────

import AdminTenantReportSubscriptions from "./AdminTenantReportSubscriptions";
import type { ReportSubscription } from "../hooks/useReportSubscriptions";

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
          `/admin-dashboard/partners/report-subscriptions?id=${encodeURIComponent(
            ENCODED_TENANT_ID
          )}`,
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
  day_of_week: 1,
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
});

// ─── Tests ───────────────────────────────────────────────────────────

describe("AdminTenantReportSubscriptions — create re-entrancy guard", () => {
  it("rapid double-click on Create fires the create mutation exactly once", async () => {
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
    await user.type(
      screen.getByPlaceholderText(/name@example.com/i),
      "ops@example.com"
    );
    await user.click(screen.getByRole("button", { name: /^Add$/ }));

    const createBtn = screen.getByRole("button", { name: /Create subscription/i });

    fireEvent.click(createBtn);
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(createMutationState.current.mutateAsync).toHaveBeenCalledTimes(1);
    });
  });
});

describe("AdminTenantReportSubscriptions — update re-entrancy guard", () => {
  it("rapid double-click on Save changes fires the update mutation exactly once", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: /Edit subscription 1/i })
    );

    const saveBtn = await screen.findByRole("button", { name: /Save changes/i });

    fireEvent.click(saveBtn);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateMutationState.current.mutateAsync).toHaveBeenCalledTimes(1);
    });
  });
});

describe("AdminTenantReportSubscriptions — delete re-entrancy guard", () => {
  it("rapid double-click on Delete confirm fires the delete mutation exactly once", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: /Delete subscription 1/i })
    );

    const dialog = await screen.findByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", { name: /^Delete$/ });

    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteMutationState.current.mutateAsync).toHaveBeenCalledTimes(1);
    });
  });

  it("disables the Delete confirm while the action is pending", async () => {
    const user = userEvent.setup();
    let resolveDelete: ((v: unknown) => void) | null = null;
    deleteMutationState.current = {
      mutateAsync: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveDelete = resolve;
          })
      ),
      isPending: false,
    };
    renderPage();

    await user.click(
      screen.getByRole("button", { name: /Delete subscription 1/i })
    );
    const dialog = await screen.findByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", {
      name: /^Delete$/,
    }) as HTMLButtonElement;

    fireEvent.click(confirmBtn);

    await waitFor(() => expect(confirmBtn).toBeDisabled());

    resolveDelete?.(undefined);
  });
});

describe("AdminTenantReportSubscriptions — toggle re-entrancy guard", () => {
  it("rapid double-click on the enabled toggle fires update exactly once", async () => {
    renderPage();

    const toggle = screen.getByLabelText(
      /Disable subscription 1/i
    ) as HTMLInputElement;

    // Two clicks in the same frame on the toggle.
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(updateMutationState.current.mutateAsync).toHaveBeenCalledTimes(1);
    });
  });
});
