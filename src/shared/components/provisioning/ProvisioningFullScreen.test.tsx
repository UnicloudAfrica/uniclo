import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import ProvisioningFullScreen from "./ProvisioningFullScreen";

vi.mock("../projects/details/SetupProgressCard", () => ({
  default: () => <div data-testid="setup-progress-card" />,
}));

describe("ProvisioningFullScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("failure state", () => {
    it("shows the failed step label + error message instead of generic 'in progress' copy", () => {
      render(
        <ProvisioningFullScreen
          project={{ name: "Demo Project", status: "failed" }}
          setupSteps={[
            { id: "1", label: "Creating cloud workspace...", status: "completed" },
            { id: "2", label: "Syncing user access...", status: "completed" },
            {
              id: "enable_project_vpc",
              label: "Enabling project for VPC...",
              status: "failed",
              context: { error: "Cloud provider authentication failed." },
            },
          ]}
        />
      );

      expect(screen.getByText("Provisioning Failed")).toBeTruthy();
      expect(screen.getByText("Stopped at: Enabling project for VPC....")).toBeTruthy();
      expect(screen.getByText("Cloud provider authentication failed.")).toBeTruthy();
    });

    it("renders the Retry button when onRetry is provided AND project failed", () => {
      const onRetry = vi.fn();

      render(
        <ProvisioningFullScreen
          project={{ name: "Demo Project", status: "failed" }}
          setupSteps={[
            { id: "1", label: "Step", status: "failed", context: { error: "boom" } },
          ]}
          onRetry={onRetry}
        />
      );

      const button = screen.getByRole("button", { name: /retry provisioning/i });
      expect(button).toBeTruthy();
      fireEvent.click(button);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("hides the Retry button when no onRetry handler is provided", () => {
      render(
        <ProvisioningFullScreen
          project={{ name: "Demo Project", status: "failed" }}
          setupSteps={[{ id: "1", label: "Step", status: "failed" }]}
        />
      );

      expect(screen.queryByRole("button", { name: /retry provisioning/i })).toBeNull();
    });

    it("disables the Retry button while the retry mutation is in flight", () => {
      const onRetry = vi.fn();

      render(
        <ProvisioningFullScreen
          project={{ name: "Demo Project", status: "failed" }}
          setupSteps={[{ id: "1", label: "Step", status: "failed" }]}
          onRetry={onRetry}
          isRetrying={true}
        />
      );

      const button = screen.getByRole("button", { name: /retrying/i }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it("does NOT show 'Provisioning Failed' when a step failed mid-retry — backend still working", () => {
      // REGRESSION: project 482513 (2026-05-09 screenshot) flashed the
      // red Provisioning Failed hero + Retry button at 11:12:24 PM
      // because the worker had pushed a "Retrying after transient error"
      // step alongside the failed "Creating cloud workspace..." step.
      // 14s later everything succeeded. The user got a false alarm and
      // a near-double-retry. The fix: trust project.status as the
      // terminal-failure signal — failed step + active retry = mid-
      // recovery, not terminal.
      render(
        <ProvisioningFullScreen
          project={{ name: "Demo Project", status: "provisioning" }}
          setupSteps={[
            {
              id: "initialize_workspace",
              label: "Creating cloud workspace...",
              status: "failed",
              context: { error: "transient timeout" },
            },
            {
              id: "retry_provisioning",
              label: "Retrying after transient error...",
              status: "retrying",
            },
            { id: "syncing_user_access", label: "Syncing user access...", status: "pending" },
          ]}
        />
      );

      // No failure UI — we're mid-recovery.
      expect(screen.queryByText("Provisioning Failed")).toBeNull();
      expect(screen.queryByRole("button", { name: /retry provisioning/i })).toBeNull();
      // The normal in-progress hero shows instead.
      expect(screen.getByText(/Provisioning Demo Project/)).toBeTruthy();
    });

    it("does NOT show failure when project.status is provisioning even if a step is failed", () => {
      // Same defense, narrower case: a step is `failed` but the backend
      // still says `status: "provisioning"`. Trust the backend.
      render(
        <ProvisioningFullScreen
          project={{ name: "Demo Project", status: "provisioning" }}
          setupSteps={[
            { id: "1", label: "Creating cloud workspace...", status: "failed" },
            { id: "2", label: "Syncing user access...", status: "in_progress" },
          ]}
        />
      );

      expect(screen.queryByText("Provisioning Failed")).toBeNull();
    });

    it("STOPS polling after a failure — no point hammering the API", () => {
      vi.useFakeTimers();
      const onRefresh = vi.fn();

      render(
        <ProvisioningFullScreen
          project={{ name: "Demo Project", status: "failed" }}
          setupSteps={[
            { id: "1", label: "Step1", status: "completed" },
            { id: "2", label: "Step2", status: "failed" },
          ]}
          onRefresh={onRefresh}
        />
      );

      act(() => {
        vi.advanceTimersByTime(60_000);
      });

      // No polling, no terminal refresh — terminal failure is terminal.
      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  it("does a single delayed refresh after reaching 100%", () => {
    vi.useFakeTimers();

    const onRefresh = vi.fn();

    render(
      <ProvisioningFullScreen
        project={{ name: "Demo Project" }}
        setupSteps={[
          { id: "1", label: "Workspace", status: "completed" },
          { id: "2", label: "Access", status: "completed" },
        ]}
        onRefresh={onRefresh}
      />
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("keeps polling while provisioning is still in progress", () => {
    vi.useFakeTimers();

    const onRefresh = vi.fn();

    render(
      <ProvisioningFullScreen
        project={{ name: "Demo Project" }}
        setupSteps={[
          { id: "1", label: "Workspace", status: "completed" },
          { id: "2", label: "Access", status: "in_progress" },
        ]}
        onRefresh={onRefresh}
      />
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onRefresh).toHaveBeenCalledTimes(2);
  });
});
