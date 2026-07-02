import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import InstanceHeroBanner from "../InstanceHeroBanner";

// Presentational props for a running instance. `availableActions` is the
// backend's capability-gated map: each entry is { enabled, disabled_reason? }.
function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    name: "web-1",
    identifier: "inst-123",
    status: "running",
    provider: "az-1",
    instanceType: "m1.small",
    availabilityZone: "lagos-1",
    providerVmId: "vm-abc",
    projectName: "proj",
    primaryIp: undefined,
    elasticIp: undefined,
    subnetName: undefined,
    cpuUsage: null,
    memoryUsage: null,
    networkRx: null,
    networkTx: null,
    vcpus: 2,
    memoryGb: 4,
    storageGb: 40,
    tags: [],
    availableActions: {
      migrate: { enabled: true },
      snapshot: { enabled: true },
      destroy: { enabled: true },
      extend: { enabled: true },
      suspend: { enabled: false, disabled_reason: "Not supported on this availability group" },
    },
    supportsInstanceActions: true,
    pendingAction: null,
    isConsoleLoading: false,
    onGoBack: vi.fn(),
    onAction: vi.fn(),
    onOpenConsole: vi.fn(),
    onRefreshStatus: vi.fn(),
    onCopyIdentifier: vi.fn(),
    ...overrides,
  } as unknown as React.ComponentProps<typeof InstanceHeroBanner>;
}

describe("InstanceHeroBanner action controls", () => {
  it("renders the Extend control and wires it to the extend action", () => {
    const onAction = vi.fn();
    render(<InstanceHeroBanner {...makeProps({ onAction })} />);

    fireEvent.click(screen.getByText("More"));
    const extend = screen.getByText("Extend");
    expect(extend).toBeInTheDocument();

    fireEvent.click(extend);
    expect(onAction).toHaveBeenCalledWith("extend");
  });

  it("does not fire extend when the backend disables it", () => {
    const onAction = vi.fn();
    render(
      <InstanceHeroBanner
        {...makeProps({ onAction, availableActions: { extend: { enabled: false } } })}
      />,
    );

    fireEvent.click(screen.getByText("More"));
    fireEvent.click(screen.getByText("Extend"));
    expect(onAction).not.toHaveBeenCalled();
  });

  it("surfaces the backend disabled_reason as the tooltip on a gated action", () => {
    render(<InstanceHeroBanner {...makeProps()} />);

    fireEvent.click(screen.getByText("More"));
    const suspend = screen.getByText("Suspend").closest("button");
    expect(suspend).toHaveAttribute("title", "Not supported on this availability group");
  });

  it("still renders 'Live Migration' (a backend-advertised action) in the More menu", () => {
    const onAction = vi.fn();
    render(<InstanceHeroBanner {...makeProps({ onAction })} />);

    fireEvent.click(screen.getByText("More"));
    const migrate = screen.getByText("Live Migration");
    expect(migrate).toBeInTheDocument();

    fireEvent.click(migrate);
    expect(onAction).toHaveBeenCalledWith("migrate");
  });
});
