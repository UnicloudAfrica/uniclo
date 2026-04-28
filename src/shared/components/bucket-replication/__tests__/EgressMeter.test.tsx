import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import EgressMeter from "../EgressMeter";

/**
 * EgressMeter unit tests.
 *
 * Coverage:
 *   - capUsd null → "no cap configured" hint (security-relevant: admins
 *     should see this)
 *   - 0-79% → success tone, optional help text
 *   - 80-99% → warning tone, "approaching cap" status announcement
 *   - 100%+ → danger tone, role="alert" auto-pause notice
 *   - currency formatting (en-US locale)
 */

describe("EgressMeter", () => {
  it("renders 'no cap configured' hint when capUsd is null", () => {
    render(<EgressMeter monthToDateUsd={42.5} capUsd={null} />);
    expect(screen.getByText(/No cap configured/i)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders 'no cap configured' hint when capUsd is undefined", () => {
    render(<EgressMeter monthToDateUsd={42.5} capUsd={undefined} />);
    expect(screen.getByText(/No cap configured/i)).toBeInTheDocument();
  });

  it("renders progress bar at 50% (success tone, healthy)", () => {
    render(<EgressMeter monthToDateUsd={50} capUsd={100} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeInTheDocument();
    expect(screen.getByText(/\$50\.00 \/ \$100\.00/)).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it("shows help text below 80% when showHelpText=true (default)", () => {
    render(<EgressMeter monthToDateUsd={50} capUsd={100} />);
    expect(
      screen.getByText(/Auto-pauses replication when egress exceeds cap/i),
    ).toBeInTheDocument();
  });

  it("hides help text when showHelpText=false", () => {
    render(<EgressMeter monthToDateUsd={50} capUsd={100} showHelpText={false} />);
    expect(
      screen.queryByText(/Auto-pauses replication when egress exceeds cap/i),
    ).not.toBeInTheDocument();
  });

  it("shows 'Approaching cap' warning at 85%", () => {
    render(<EgressMeter monthToDateUsd={85} capUsd={100} />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/Approaching cap/i);
  });

  it("renders role=alert auto-pause notice at 100%", () => {
    render(<EgressMeter monthToDateUsd={100} capUsd={100} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/Cap reached/i);
    expect(alert).toHaveTextContent(/auto-paused/i);
    expect(alert).toHaveTextContent(/egress_cap_reached/);
  });

  it("renders alert above 100% (over-limit case)", () => {
    render(<EgressMeter monthToDateUsd={150} capUsd={100} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/150%/)).toBeInTheDocument();
  });

  it("does NOT render approaching-cap warning AND alert at 100% (only alert)", () => {
    render(<EgressMeter monthToDateUsd={100} capUsd={100} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("treats null monthToDateUsd as 0", () => {
    render(<EgressMeter monthToDateUsd={null} capUsd={100} />);
    // Numeric label appears once in the spend display ($0.00 / $100.00 · 0%)
    expect(screen.getByText(/\$0\.00 \/ \$100\.00 · 0%/)).toBeInTheDocument();
  });

  it("clamps negative monthToDateUsd to 0", () => {
    render(<EgressMeter monthToDateUsd={-50} capUsd={100} />);
    expect(screen.getByText(/\$0\.00 \/ \$100\.00/)).toBeInTheDocument();
  });

  it("uses custom label when provided", () => {
    render(
      <EgressMeter
        monthToDateUsd={10}
        capUsd={100}
        label="Custom Egress Label"
      />,
    );
    // Label appears in the label span AND in the progressbar's aria-label;
    // assert at least one occurrence rather than a unique match.
    expect(screen.getAllByText(/Custom Egress Label/).length).toBeGreaterThan(0);
  });

  it("aria-label on the figure announces spend + cap + percent", () => {
    render(<EgressMeter monthToDateUsd={50} capUsd={100} />);
    const announce = screen.getByLabelText(/Spent \$50\.00 of cap \$100\.00 — 50 percent/);
    expect(announce).toBeInTheDocument();
  });
});
