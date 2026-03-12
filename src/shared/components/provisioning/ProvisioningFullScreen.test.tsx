import { act, render } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import ProvisioningFullScreen from "./ProvisioningFullScreen";

vi.mock("../projects/details/SetupProgressCard", () => ({
  default: () => <div data-testid="setup-progress-card" />,
}));

describe("ProvisioningFullScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
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
