/**
 * Tests for TenantDunningSettings page.
 *
 * Mocks useFetchDunningPolicy and useUpdateDunningPolicy at the module
 * boundary so we exercise rendering paths (loading / error / populated)
 * and form submission without touching the network layer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";

// ─── Module mocks ────────────────────────────────────────────────

const mockMutate = vi.fn();

const fetchState: {
  data: unknown;
  isLoading: boolean;
  isError: boolean;
} = { data: undefined, isLoading: false, isError: false };

const mutationState: { isPending: boolean } = { isPending: false };

vi.mock("@/shared/hooks/resources/dunningHooks", () => ({
  useFetchDunningPolicy: () => fetchState,
  useUpdateDunningPolicy: () => ({
    mutate: mockMutate,
    isPending: mutationState.isPending,
  }),
}));

// TenantPageShell pulls in routing + branding context. Stub it to a
// pass-through so tests stay focused on the dunning form itself.
vi.mock("../../../dashboard/components/TenantPageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import TenantDunningSettings from "../TenantDunningSettings";
import React from "react";

// ─── Helpers ─────────────────────────────────────────────────────

function renderPage(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

const samplePolicy = {
  grace_days: 5,
  retry_schedule: [3, 7, 14],
  auto_suspend: false,
  suspend_after_days: 30,
};

// ─── Tests ───────────────────────────────────────────────────────

beforeEach(() => {
  fetchState.data = undefined;
  fetchState.isLoading = false;
  fetchState.isError = false;
  mutationState.isPending = false;
  mockMutate.mockReset();
});

describe("TenantDunningSettings", () => {
  it("renders loading skeleton when fetching", () => {
    fetchState.isLoading = true;
    renderPage(<TenantDunningSettings />);
    // The skeleton uses animate-pulse; confirm the form is absent.
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/grace days/i)).not.toBeInTheDocument();
  });

  it("renders an error message when the fetch fails", () => {
    fetchState.isError = true;
    renderPage(<TenantDunningSettings />);
    expect(
      screen.getByText(/Failed to load dunning policy/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/grace days/i)).not.toBeInTheDocument();
  });

  it("renders form fields populated from the fetched policy", () => {
    fetchState.data = samplePolicy;
    renderPage(<TenantDunningSettings />);

    const graceInput = screen.getByLabelText(/grace days/i) as HTMLInputElement;
    expect(graceInput.value).toBe("5");

    const retryInput = screen.getByLabelText(
      /retry days/i
    ) as HTMLInputElement;
    expect(retryInput.value).toBe("3, 7, 14");

    // auto_suspend is false → suspend_after_days field should be hidden.
    expect(screen.queryByLabelText(/suspend after/i)).not.toBeInTheDocument();
  });

  it("reveals suspend_after_days field when auto_suspend is checked", () => {
    fetchState.data = samplePolicy;
    renderPage(<TenantDunningSettings />);

    const checkbox = screen.getByLabelText(
      /enable automatic account suspension/i
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(
      screen.getByLabelText(/suspend after/i)
    ).toBeInTheDocument();
  });

  it("calls mutate with the correct payload on submit", async () => {
    fetchState.data = samplePolicy;
    renderPage(<TenantDunningSettings />);

    // Change grace_days to 7.
    const graceInput = screen.getByLabelText(/grace days/i);
    fireEvent.change(graceInput, { target: { value: "7" } });

    const saveButton = screen.getByRole("button", { name: /save policy/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledOnce();
    });

    const payload = mockMutate.mock.calls[0][0];
    expect(payload.grace_days).toBe(7);
    expect(payload.retry_schedule).toEqual([3, 7, 14]);
    expect(payload.auto_suspend).toBe(false);
    expect(payload.suspend_after_days).toBe(30);
  });

  it("disables the save button while mutation is pending", () => {
    fetchState.data = samplePolicy;
    mutationState.isPending = true;
    renderPage(<TenantDunningSettings />);

    const saveButton = screen.getByRole("button", { name: /saving/i });
    expect(saveButton).toBeDisabled();
  });

  it("parses a custom retry schedule correctly before submit", async () => {
    fetchState.data = samplePolicy;
    renderPage(<TenantDunningSettings />);

    const retryInput = screen.getByLabelText(/retry days/i);
    fireEvent.change(retryInput, { target: { value: "5, 10, 20" } });

    fireEvent.click(screen.getByRole("button", { name: /save policy/i }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalledOnce());
    expect(mockMutate.mock.calls[0][0].retry_schedule).toEqual([5, 10, 20]);
  });
});
