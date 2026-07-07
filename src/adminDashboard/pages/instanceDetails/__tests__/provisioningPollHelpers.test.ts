import { describe, expect, it } from "vitest";

import {
  managementRefetchInterval,
  PROVISIONING_POLL_INTERVAL_MS,
  PROVISIONING_POLL_MAX_ATTEMPTS,
  shouldContinueInstancePoll,
} from "../instanceDetailsUtils";

/**
 * These two pure helpers are what keep the HeroBanner from latching disabled
 * after a power action: the refetchInterval decision passively re-polls the
 * management query while the instance is transitional, and the action-aware
 * poll decision keeps a stop-poll alive through the transient "active" the
 * provider reports before the shutdown starts registering.
 */
describe("managementRefetchInterval", () => {
  const payload = (status: unknown) => ({ instance: { status } });

  it("polls while the instance is transitional", () => {
    expect(managementRefetchInterval(payload("provisioning"))).toBe(PROVISIONING_POLL_INTERVAL_MS);
    expect(managementRefetchInterval(payload("pending"))).toBe(PROVISIONING_POLL_INTERVAL_MS);
    expect(managementRefetchInterval(payload("awaiting_manual_provisioning"))).toBe(
      PROVISIONING_POLL_INTERVAL_MS
    );
  });

  it("stops polling once the instance settles", () => {
    expect(managementRefetchInterval(payload("active"))).toBe(false);
    expect(managementRefetchInterval(payload("running"))).toBe(false);
    expect(managementRefetchInterval(payload("suspended"))).toBe(false);
    expect(managementRefetchInterval(payload("failed"))).toBe(false);
  });

  it("returns false for missing or malformed payloads", () => {
    expect(managementRefetchInterval(undefined)).toBe(false);
    expect(managementRefetchInterval(null)).toBe(false);
    expect(managementRefetchInterval("provisioning")).toBe(false);
    expect(managementRefetchInterval({})).toBe(false);
    expect(managementRefetchInterval({ instance: null })).toBe(false);
    expect(managementRefetchInterval({ instance: {} })).toBe(false);
  });
});

describe("shouldContinueInstancePoll", () => {
  it("continues on transitional statuses for any action", () => {
    expect(shouldContinueInstancePoll("start", "provisioning", 0)).toBe(true);
    expect(shouldContinueInstancePoll("stop", "pending", 3)).toBe(true);
    expect(shouldContinueInstancePoll(null, "awaiting_manual_provisioning", 5)).toBe(true);
    expect(shouldContinueInstancePoll("reboot", "", 0)).toBe(true);
    expect(shouldContinueInstancePoll("reboot", null, 0)).toBe(true);
    expect(shouldContinueInstancePoll("reboot", undefined, 0)).toBe(true);
  });

  it("keeps a stop-poll alive through the pre-shutdown running blip", () => {
    // A just-stopped VM still reads active/running until the provider starts
    // reporting the shutdown — the poll must NOT die on that first tick.
    expect(shouldContinueInstancePoll("stop", "active", 0)).toBe(true);
    expect(shouldContinueInstancePoll("stop", "running", 2)).toBe(true);
    expect(shouldContinueInstancePoll("stop", "spawning", 1)).toBe(true);
    expect(shouldContinueInstancePoll("force_stop", "active", 0)).toBe(true);
    expect(shouldContinueInstancePoll("suspend", "running", 0)).toBe(true);
    expect(shouldContinueInstancePoll("hibernate", "active", 0)).toBe(true);
  });

  it("stops a stop-poll on its settled targets and failures", () => {
    expect(shouldContinueInstancePoll("stop", "suspended", 1)).toBe(false);
    expect(shouldContinueInstancePoll("stop", "stopped", 1)).toBe(false);
    expect(shouldContinueInstancePoll("stop", "failed", 1)).toBe(false);
    expect(shouldContinueInstancePoll("stop", "terminated", 1)).toBe(false);
  });

  it("treats active as the terminal for start-like actions", () => {
    expect(shouldContinueInstancePoll("start", "active", 0)).toBe(false);
    expect(shouldContinueInstancePoll("resume", "running", 0)).toBe(false);
    expect(shouldContinueInstancePoll("reboot", "active", 2)).toBe(false);
    expect(shouldContinueInstancePoll(null, "suspended", 0)).toBe(false);
  });

  it("gives up at the attempt cap regardless of status", () => {
    expect(shouldContinueInstancePoll("stop", "active", PROVISIONING_POLL_MAX_ATTEMPTS)).toBe(
      false
    );
    expect(
      shouldContinueInstancePoll("start", "provisioning", PROVISIONING_POLL_MAX_ATTEMPTS)
    ).toBe(false);
  });

  it("normalizes casing on both action and status", () => {
    expect(shouldContinueInstancePoll("Stop", "ACTIVE", 0)).toBe(true);
    expect(shouldContinueInstancePoll("STOP", "Suspended", 0)).toBe(false);
  });
});
