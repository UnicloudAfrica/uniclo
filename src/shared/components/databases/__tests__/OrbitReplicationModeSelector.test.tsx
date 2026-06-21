import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrbitReplicationModeSelector from "../OrbitReplicationModeSelector";

/**
 * Mode-selector contract tests.
 *
 * The selector is the single user-facing surface for picking the
 * Phase-2 replication path. These tests pin three things:
 *
 *   1. It renders both cards in a proper ARIA radiogroup so keyboard
 *      and screen-reader users can navigate.
 *   2. Disabled-with-reason renders the explanatory copy AND blocks
 *      clicks — the parent's `onChange` is not invoked.
 *   3. Mode-specific caveats from the engine catalog show up under
 *      the active card. Empty/missing caveats arrays render nothing
 *      (no empty list with a bare "Info" icon).
 */

describe("OrbitReplicationModeSelector", () => {
  it("renders both modes as a radiogroup with the active one aria-checked", () => {
    render(
      <OrbitReplicationModeSelector value="standard" onChange={() => {}} />,
    );

    const group = screen.getByRole("radiogroup", { name: /replication mode/i });
    expect(group).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
  });

  it("emits the new mode on click of the inactive card", async () => {
    const onChange = vi.fn();
    render(<OrbitReplicationModeSelector value="standard" onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: /Orbit/ }));

    expect(onChange).toHaveBeenCalledWith("orbit_overlay");
  });

  it("hides the Orbit card entirely when orbitAvailable is false", () => {
    render(
      <OrbitReplicationModeSelector
        value="standard"
        onChange={() => {}}
        orbitAvailable={false}
      />,
    );

    expect(screen.queryByRole("radio", { name: /Orbit/ })).not.toBeInTheDocument();
  });

  it("renders the Orbit card as disabled with the reason and ignores clicks", async () => {
    const onChange = vi.fn();
    render(
      <OrbitReplicationModeSelector
        value="standard"
        onChange={onChange}
        orbitDisabledReason="Beta access required — contact support."
      />,
    );

    const orbitCard = screen.getByRole("radio", { name: /Orbit/ });
    expect(orbitCard).toHaveAttribute("aria-disabled", "true");
    expect(orbitCard).toBeDisabled();
    expect(
      screen.getByTestId("mode-disabled-reason"),
    ).toHaveTextContent(/Beta access required/);

    await userEvent.click(orbitCard);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders the engine catalog caveats list when active mode has caveats", () => {
    render(
      <OrbitReplicationModeSelector
        value="orbit_overlay"
        onChange={() => {}}
        caveats={[
          "MongoDB replica sets are sensitive to election latency.",
          "For cross-provider topologies, RTT under 100ms is recommended.",
        ]}
      />,
    );

    const list = screen.getByTestId("orbit-mode-caveats");
    expect(list).toHaveTextContent(/election latency/);
    expect(list).toHaveTextContent(/RTT under 100ms/);
  });

  it("omits the caveats list entirely when caveats is empty", () => {
    render(
      <OrbitReplicationModeSelector
        value="orbit_overlay"
        onChange={() => {}}
        caveats={[]}
      />,
    );

    expect(screen.queryByTestId("orbit-mode-caveats")).not.toBeInTheDocument();
  });

  it("renders Orbit and Standard cards with no beta gating language", () => {
    // Pin the post-refactor contract: Orbit is GA, no "Beta" label.
    // Catches accidental re-introduction of the beta badge via copy
    // changes elsewhere.
    render(<OrbitReplicationModeSelector value="standard" onChange={() => {}} />);

    const orbitCard = screen.getByRole("radio", { name: /Orbit/ });
    expect(orbitCard).not.toHaveTextContent(/Beta/i);
  });
});
