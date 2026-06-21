import { describe, it, expect } from "vitest";
import {
  isProvisioning,
  isRunning,
  isStopped,
  summarizeInstances,
} from "../instanceStatus";

describe("instanceStatus classification", () => {
  it("counts backend `pending` + `awaiting_manual_provisioning` as provisioning", () => {
    // Regression: a freshly ordered VM is `pending`; the old filter only
    // matched `provisioning`, so a building fleet showed "Provisioning 0".
    expect(isProvisioning("pending")).toBe(true);
    expect(isProvisioning("awaiting_manual_provisioning")).toBe(true);
    expect(isProvisioning("provisioning")).toBe(true);
    expect(isProvisioning("PENDING")).toBe(true); // case-insensitive
  });

  it("does not count active/terminal states as provisioning", () => {
    for (const s of ["active", "suspended", "terminated", "failed", "error", "payment_pending"]) {
      expect(isProvisioning(s)).toBe(false);
    }
  });

  it("classifies running and stopped states", () => {
    expect(isRunning("active")).toBe(true);
    expect(isRunning("pending")).toBe(false);
    expect(isStopped("suspended")).toBe(true);
    expect(isStopped("active")).toBe(false);
  });

  it("tolerates null/undefined/unknown status", () => {
    expect(isProvisioning(undefined)).toBe(false);
    expect(isProvisioning(null)).toBe(false);
    expect(isRunning("")).toBe(false);
  });

  it("summarizes the WHOLE fleet, not a page (13 pending -> provisioning 13)", () => {
    // Mirrors the live discrepancy: 17 instances = 3 active + 1 error + 13 pending.
    const fleet = [
      ...Array.from({ length: 3 }, () => ({ status: "active", bandwidth_count: 1 })),
      { status: "error" },
      ...Array.from({ length: 13 }, () => ({ status: "pending" })),
    ];

    const s = summarizeInstances(fleet);
    expect(s.total).toBe(17);
    expect(s.running).toBe(3);
    expect(s.provisioning).toBe(13);
    expect(s.stopped).toBe(0);
    expect(s.bandwidthReady).toBe(3);
  });
});
