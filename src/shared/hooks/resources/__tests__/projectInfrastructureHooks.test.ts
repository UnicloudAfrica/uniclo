import { describe, it, expect } from "vitest";
import { resolvePollingInterval, resolveStatusNotification } from "../projectInfrastructureHooks";

/**
 * Pure-function tests for the decisions extracted from `useProjectStatusPolling`:
 * `resolvePollingInterval` (the v5 `refetchInterval` callback) and
 * `resolveStatusNotification` (the v5 replacement for the removed `onSuccess`,
 * driving the `onStatusChange` option from an effect).
 *
 * The status endpoint envelope is `{ project: { status, ... } }` (no `data`
 * wrapper), so the status is read at `project.status` — both helpers carry a
 * regression guard against the old top-level `.status` read.
 */

const baseOpts = {
  elapsedMs: 0,
  maxPollingTime: 1_800_000,
  stopOnStatus: ["active", "failed", "deleted"],
  interval: 30_000,
};

describe("resolvePollingInterval", () => {
  it("keeps polling on a non-terminal status", () => {
    expect(resolvePollingInterval({ project: { status: "provisioning" } }, baseOpts)).toBe(30_000);
  });

  it("keeps polling when data is undefined (first tick, before any success)", () => {
    expect(resolvePollingInterval(undefined, baseOpts)).toBe(30_000);
  });

  it.each(["active", "failed", "deleted"])("stops polling on terminal status %s", (status) => {
    expect(resolvePollingInterval({ project: { status } }, baseOpts)).toBe(false);
  });

  it("stops polling once the polling window is exhausted, regardless of status", () => {
    expect(
      resolvePollingInterval(
        { project: { status: "provisioning" } },
        { ...baseOpts, elapsedMs: baseOpts.maxPollingTime + 1 }
      )
    ).toBe(false);
  });

  it("keeps polling at the exact window boundary (strict > semantics)", () => {
    expect(
      resolvePollingInterval(
        { project: { status: "provisioning" } },
        { ...baseOpts, elapsedMs: baseOpts.maxPollingTime }
      )
    ).toBe(30_000);
  });

  it("reads status at project.status, not top-level (envelope regression guard)", () => {
    // Old, wrong read path: a top-level `status` must NOT be treated as terminal.
    expect(resolvePollingInterval({ status: "active" }, baseOpts)).toBe(30_000);
  });

  it("respects a custom interval", () => {
    expect(
      resolvePollingInterval({ project: { status: "provisioning" } }, { ...baseOpts, interval: 5_000 })
    ).toBe(5_000);
  });

  it("respects a custom stopOnStatus set", () => {
    const opts = { ...baseOpts, stopOnStatus: ["error"] };
    expect(resolvePollingInterval({ project: { status: "error" } }, opts)).toBe(false);
    expect(resolvePollingInterval({ project: { status: "active" } }, opts)).toBe(30_000);
  });

  it("keeps polling when status is not a string", () => {
    expect(resolvePollingInterval({ project: { status: null } }, baseOpts)).toBe(30_000);
  });
});

describe("resolveStatusNotification", () => {
  it("notifies the first observed status", () => {
    expect(resolveStatusNotification({ project: { status: "provisioning" } }, null)).toBe(
      "provisioning"
    );
  });

  it("does not re-notify an unchanged status", () => {
    expect(resolveStatusNotification({ project: { status: "provisioning" } }, "provisioning")).toBe(
      null
    );
  });

  it("notifies a status transition", () => {
    expect(resolveStatusNotification({ project: { status: "active" } }, "provisioning")).toBe(
      "active"
    );
  });

  it("does not notify before any data arrives", () => {
    expect(resolveStatusNotification(undefined, null)).toBe(null);
  });

  it("does not notify when status is not a string", () => {
    expect(resolveStatusNotification({ project: { status: null } }, null)).toBe(null);
  });

  it("reads status at project.status, not top-level (envelope regression guard)", () => {
    expect(resolveStatusNotification({ status: "active" }, null)).toBe(null);
  });
});
