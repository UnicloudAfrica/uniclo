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
