import { describe, it, expect } from "vitest";
import {
  filterSameProviderReplicaAzs,
  tagReplicaAzModes,
  type AzOption,
} from "@/hooks/useDatabaseProvisioningLogic";

/**
 * Replica AZ filter + mode-tagger contract.
 *
 * Two helpers under test:
 *
 *   - `filterSameProviderReplicaAzs` — legacy filter. Used by callers
 *     that don't want mode-aware UX. Excludes the primary AZ and any
 *     cross-provider AZ; returns the rest verbatim.
 *
 *   - `tagReplicaAzModes` — the new mode-aware tagger. EVERY AZ comes
 *     back tagged with one of four modes (same_provider /
 *     public_endpoint / orbit_overlay / unavailable) and a `selectable`
 *     flag. The wizard renders badges + disabled states off these
 *     tags, so cross-provider AZs are visible (not hidden) — addresses
 *     the customer-reported regression where the platform appeared to
 *     not support cross-cloud replicas at all.
 */

const az = (value: string, provider: string): AzOption => ({
  value,
  label: value,
  provider,
});

describe("filterSameProviderReplicaAzs (legacy filter)", () => {
  it("excludes the primary AZ itself", () => {
    const zones = [az("az1", "alpha"), az("az2", "alpha"), az("az3", "alpha")];
    const result = filterSameProviderReplicaAzs(zones, "az1", "alpha");
    expect(result.map((z) => z.value)).toEqual(["az2", "az3"]);
  });

  it("excludes AZs whose provider differs from the primary's provider", () => {
    const zones = [
      az("az1", "alpha"),
      az("az2", "alpha"),
      az("az3", "beta"),
    ];
    const result = filterSameProviderReplicaAzs(zones, "az1", "alpha");
    expect(result.map((z) => z.value)).toEqual(["az2"]);
  });

  it("returns the full list (minus primary) when primary provider is unknown — fail open, not closed", () => {
    const zones = [az("az1", ""), az("az2", "alpha"), az("az3", "beta")];
    const result = filterSameProviderReplicaAzs(zones, "az1", "");
    expect(result.map((z) => z.value)).toEqual(["az2", "az3"]);
  });

  it("returns the full input list verbatim when no primary AZ is selected", () => {
    const zones = [az("az1", "alpha"), az("az2", "beta")];
    const result = filterSameProviderReplicaAzs(zones, "", "");
    expect(result).toEqual(zones);
  });
});

describe("tagReplicaAzModes — same-provider AZs", () => {
  it("tags same-provider AZs as 'same_provider' and selectable", () => {
    const zones = [az("az1", "alpha"), az("az2", "alpha"), az("az3", "alpha")];
    const result = tagReplicaAzModes(zones, "az1", "alpha", "disk_backed");
    expect(result).toEqual([
      { value: "az2", label: "az2", provider: "alpha", mode: "same_provider", selectable: true },
      { value: "az3", label: "az3", provider: "alpha", mode: "same_provider", selectable: true },
    ]);
  });

  it("excludes the primary AZ itself", () => {
    const zones = [az("az1", "alpha"), az("az2", "alpha")];
    const result = tagReplicaAzModes(zones, "az1", "alpha", "disk_backed");
    expect(result.map((z) => z.value)).toEqual(["az2"]);
  });
});

describe("tagReplicaAzModes — cross-provider, public-endpoint-capable engines", () => {
  it("tags cross-provider AZs as 'public_endpoint' and SELECTABLE when feature flag is on (disk_backed)", () => {
    const zones = [az("az1", "alpha"), az("az3", "beta")];
    const result = tagReplicaAzModes(zones, "az1", "alpha", "disk_backed", {
      crossProviderProvisioningEnabled: true,
    });
    expect(result).toEqual([
      { value: "az3", label: "az3", provider: "beta", mode: "public_endpoint", selectable: true },
    ]);
  });

  it("tags cross-provider AZs as 'public_endpoint' but NOT selectable when feature flag is off", () => {
    const zones = [az("az1", "alpha"), az("az3", "beta")];
    const result = tagReplicaAzModes(zones, "az1", "alpha", "disk_backed", {
      crossProviderProvisioningEnabled: false,
    });
    expect(result[0].mode).toBe("public_endpoint");
    expect(result[0].selectable).toBe(false);
  });

  it("treats in_memory engines (Redis) the same as disk_backed", () => {
    const zones = [az("az1", "alpha"), az("az3", "beta")];
    const result = tagReplicaAzModes(zones, "az1", "alpha", "in_memory", {
      crossProviderProvisioningEnabled: true,
    });
    expect(result[0].mode).toBe("public_endpoint");
    expect(result[0].selectable).toBe(true);
  });

  it("treats licensed engines (SQL Server AG, Oracle Data Guard) the same as disk_backed", () => {
    const zones = [az("az1", "alpha"), az("az3", "beta")];
    const result = tagReplicaAzModes(zones, "az1", "alpha", "licensed", {
      crossProviderProvisioningEnabled: true,
    });
    expect(result[0].mode).toBe("public_endpoint");
    expect(result[0].selectable).toBe(true);
  });
});

describe("tagReplicaAzModes — cross-provider, overlay-only engines", () => {
  it("tags cross-provider AZs as 'orbit_overlay' for native_distributed engines (Cassandra)", () => {
    const zones = [az("az1", "alpha"), az("az3", "beta")];
    const result = tagReplicaAzModes(zones, "az1", "alpha", "native_distributed", {
      crossProviderProvisioningEnabled: true,
    });
    expect(result[0].mode).toBe("orbit_overlay");
    expect(result[0].selectable).toBe(false); // Orbit execution path is still beta
  });
});

describe("tagReplicaAzModes — cross-provider, no-mode-available engines", () => {
  it("tags cross-provider AZs as 'unavailable' for consensus_kv engines (etcd, Consul)", () => {
    // Raft consensus can't survive public-internet RTT. Even overlay
    // can't fix the physics, so both modes are off.
    const zones = [az("az1", "alpha"), az("az3", "beta")];
    const result = tagReplicaAzModes(zones, "az1", "alpha", "consensus_kv", {
      crossProviderProvisioningEnabled: true,
    });
    expect(result[0].mode).toBe("unavailable");
    expect(result[0].selectable).toBe(false);
  });

  it("tags cross-provider AZs as 'unavailable' when the engine tier is unknown", () => {
    const zones = [az("az1", "alpha"), az("az3", "beta")];
    const result = tagReplicaAzModes(zones, "az1", "alpha", null, {
      crossProviderProvisioningEnabled: true,
    });
    expect(result[0].mode).toBe("unavailable");
    expect(result[0].selectable).toBe(false);
  });
});

describe("tagReplicaAzModes — edge cases", () => {
  it("returns the unfiltered list (with provider-derived tagging) when no primary is selected", () => {
    const zones = [az("az1", "alpha"), az("az2", "alpha"), az("az3", "beta")];
    const result = tagReplicaAzModes(zones, "", "", "disk_backed");
    // No primary → no exclusion. Without a primary provider every AZ
    // is treated as same-provider (fail-open).
    expect(result.map((z) => z.value)).toEqual(["az1", "az2", "az3"]);
    expect(result.every((z) => z.mode === "same_provider")).toBe(true);
  });

  it("tags an AZ with empty provider as same_provider (legacy data — fail open)", () => {
    const zones = [az("az1", "alpha"), az("az2", "")];
    const result = tagReplicaAzModes(zones, "az1", "alpha", "disk_backed");
    expect(result[0].mode).toBe("same_provider");
    expect(result[0].selectable).toBe(true);
  });
});
