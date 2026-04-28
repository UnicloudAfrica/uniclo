import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RpoGauge from "../RpoGauge";
import type { BucketReplicationHealth } from "../types";

/**
 * RpoGauge unit tests.
 *
 * Coverage focuses on the four state transitions that matter for ops:
 *   - skeleton (no health yet) — must NOT cause layout shift
 *   - error (request failed) — must show error state, optional retry
 *   - steady-mode success — green tone, formatted RPO label
 *   - catch-up mode — amber CATCH-UP badge, danger tone suppressed (EC-39)
 *
 * NOT covered: Gauge primitive's internal SVG rendering — that's the
 * primitive's responsibility.
 */

function makeHealth(overrides: Partial<BucketReplicationHealth> = {}): BucketReplicationHealth {
  return {
    rpo_total_seconds: 30,
    rpo_target_seconds: 300,
    mode: "steady",
    ingestion_lag_seconds: 5,
    apply_lag_seconds: 25,
    queue_depth: 0,
    interactive_queue_depth: 0,
    bulk_queue_depth: 0,
    egress_month_to_date_usd: 0,
    egress_cap_usd: null,
    last_heartbeat_at: new Date().toISOString(),
    last_event_applied_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("RpoGauge", () => {
  it("renders skeleton with aria-busy when health is null", () => {
    render(<RpoGauge health={null} />);
    const wrapper = screen.getByLabelText(/RPO loading/i);
    expect(wrapper).toHaveAttribute("aria-busy", "true");
  });

  it("renders skeleton when isLoading is true even with health data", () => {
    render(<RpoGauge health={makeHealth()} isLoading />);
    expect(screen.getByLabelText(/RPO loading/i)).toBeInTheDocument();
  });

  it("renders error state when error prop is set", () => {
    render(<RpoGauge health={null} error={new Error("Network down")} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/Health unavailable/i);
  });

  it("error state takes precedence over null health (no skeleton flash)", () => {
    render(<RpoGauge health={null} error={new Error("boom")} />);
    expect(screen.queryByLabelText(/RPO loading/i)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders retry button when onRetry callback is provided", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <RpoGauge
        health={null}
        error={new Error("boom")}
        onRetry={onRetry}
      />,
    );

    const retry = screen.getByRole("button", { name: /Retry/i });
    await user.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does NOT render retry button when onRetry is omitted", () => {
    render(<RpoGauge health={null} error={new Error("boom")} />);
    expect(screen.queryByRole("button", { name: /Retry/i })).not.toBeInTheDocument();
  });

  it("renders formatted RPO label in steady mode", () => {
    render(<RpoGauge health={makeHealth({ rpo_total_seconds: 45, mode: "steady" })} />);
    // 45s formatted as "45s"
    expect(screen.getAllByText(/45s/).length).toBeGreaterThan(0);
  });

  it("shows CATCH-UP badge in catch-up mode", () => {
    render(
      <RpoGauge
        health={makeHealth({ mode: "catchup", rpo_total_seconds: 1800 })}
      />,
    );
    expect(screen.getByText(/Catch-up/i)).toBeInTheDocument();
  });

  it("shows 'of {target}' label in steady mode (no catch-up badge)", () => {
    render(<RpoGauge health={makeHealth({ mode: "steady" })} />);
    expect(screen.queryByText(/Catch-up/i)).not.toBeInTheDocument();
    expect(screen.getByText(/of 5m/i)).toBeInTheDocument(); // 300s = 5m
  });

  it("hideLabel suppresses the secondary label rendering", () => {
    render(
      <RpoGauge health={makeHealth({ rpo_total_seconds: 45 })} hideLabel />,
    );
    // Gauge primitive's internal display value still renders, but the
    // duplicate label below the gauge should not.
    expect(screen.queryByText(/of 5m/i)).not.toBeInTheDocument();
  });

  it("formats large durations correctly", () => {
    // 90061s = 1d 1h
    render(<RpoGauge health={makeHealth({ rpo_total_seconds: 90061 })} />);
    expect(screen.getAllByText(/1d 1h/).length).toBeGreaterThan(0);
  });

  it("treats rpo_total_seconds=null as 0 (not a crash)", () => {
    render(<RpoGauge health={makeHealth({ rpo_total_seconds: null })} />);
    // formatDuration(0) returns "<1s" (sub-second branch) — NOT a crash
    expect(screen.getAllByText("<1s").length).toBeGreaterThan(0);
  });
});
