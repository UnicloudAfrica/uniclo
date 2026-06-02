/**
 * Tests for archive/activate handlers in AdminProjects.
 *
 * Mocks the hook layer so assertions exercise the handler logic
 * (toast messages, refetch on success, error handling) without
 * touching the network or QueryClient internals.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ─── Mutable mutation state stubs ────────────────────────────────────

const archiveMutateAsync = vi.fn();
const activateMutateAsync = vi.fn();
const bulkArchiveMutateAsync = vi.fn();
const bulkActivateMutateAsync = vi.fn();
const deleteMutateAsync = vi.fn();
const bulkSyncMutateAsync = vi.fn();
const refetch = vi.fn().mockResolvedValue(undefined);

// ─── Module mocks ────────────────────────────────────────────────────

vi.mock("@/hooks/adminHooks/projectHooks", () => ({
  useFetchProjects: () => ({
    data: {
      data: [
        {
          id: 1,
          identifier: "proj-abc",
          name: "Alpha Project",
          status: "active",
          tenant_id: 10,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        },
      ],
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch,
  }),
  useDeleteProject: () => ({
    mutateAsync: deleteMutateAsync,
    isPending: false,
  }),
  useBulkSyncProjectStatus: () => ({
    mutateAsync: bulkSyncMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/shared/hooks/resources/projectHooks", () => ({
  useArchiveProject: () => ({
    mutateAsync: archiveMutateAsync,
    isPending: false,
  }),
  useActivateProject: () => ({
    mutateAsync: activateMutateAsync,
    isPending: false,
  }),
  useBulkArchiveProjects: () => ({
    mutateAsync: bulkArchiveMutateAsync,
    isPending: false,
  }),
  useBulkActivateProjects: () => ({
    mutateAsync: bulkActivateMutateAsync,
    isPending: false,
  }),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastInfo = vi.fn();
vi.mock("@/utils/toastUtil", () => ({
  default: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
    info: (msg: string) => toastInfo(msg),
    warning: vi.fn(),
  },
}));

// AdminPageShell renders children directly — stub minimally.
vi.mock("../../components/AdminPageShell", () => ({
  default: ({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) => (
    <div>
      {actions}
      {children}
    </div>
  ),
}));

// ProjectsPageContainer calls the callbacks passed as props.
// Stub it to render buttons that invoke the callbacks directly.
vi.mock("@/shared/components/projects/ProjectsPageContainer", () => ({
  default: ({
    onArchiveProject,
    onActivateProject,
    projects,
  }: {
    onArchiveProject: (p: { identifier: string; name: string }) => void;
    onActivateProject: (p: { identifier: string; name: string }) => void;
    projects: Array<{ identifier: string; name: string }>;
  }) => (
    <div>
      {projects.map((p) => (
        <div key={p.identifier}>
          <button onClick={() => onArchiveProject(p)}>Archive {p.name}</button>
          <button onClick={() => onActivateProject(p)}>Activate {p.name}</button>
        </div>
      ))}
    </div>
  ),
}));

// ─── SUT ─────────────────────────────────────────────────────────────

import AdminProjects from "../adminProjects";

// ─── Scaffolding ──────────────────────────────────────────────────────

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <AdminProjects />
      </QueryClientProvider>
    </MemoryRouter>
  );
};

// ─── Tests ───────────────────────────────────────────────────────────

describe("AdminProjects — archive handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refetch.mockResolvedValue(undefined);
  });

  it("calls archive mutation with the project identifier on success", async () => {
    archiveMutateAsync.mockResolvedValue({});
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /archive alpha project/i }));

    await waitFor(() => {
      expect(archiveMutateAsync).toHaveBeenCalledWith("proj-abc");
    });
  });

  it("shows success toast and refetches list after archive", async () => {
    archiveMutateAsync.mockResolvedValue({});
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /archive alpha project/i }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining("Alpha Project"));
      expect(refetch).toHaveBeenCalled();
    });
  });

  it("shows error toast and does NOT refetch when archive fails", async () => {
    archiveMutateAsync.mockRejectedValue(new Error("Server error"));
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /archive alpha project/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
      expect(refetch).not.toHaveBeenCalled();
    });
  });
});

describe("AdminProjects — activate handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refetch.mockResolvedValue(undefined);
  });

  it("calls activate mutation with the project identifier on success", async () => {
    activateMutateAsync.mockResolvedValue({});
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /activate alpha project/i }));

    await waitFor(() => {
      expect(activateMutateAsync).toHaveBeenCalledWith("proj-abc");
    });
  });

  it("shows success toast and refetches list after activate", async () => {
    activateMutateAsync.mockResolvedValue({});
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /activate alpha project/i }));

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining("Alpha Project"));
      expect(refetch).toHaveBeenCalled();
    });
  });

  it("shows error toast and does NOT refetch when activate fails", async () => {
    activateMutateAsync.mockRejectedValue(new Error("Server error"));
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /activate alpha project/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
      expect(refetch).not.toHaveBeenCalled();
    });
  });
});
