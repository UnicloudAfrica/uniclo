import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReplicaPickerHeader, { ReplicaPickerFooter } from "../ReplicaPicker";
import type { ReplicationConfig } from "@/types/managedDatabase";

/**
 * ReplicaPicker tier-aware rendering contract.
 *
 * The wizard's per-tier UX divergence (Cluster Size vs Read Replicas
 * vs Consensus Cluster + warnings + BYOL badge) all lives in these
 * two extracted components. The wizard itself is too heavy to unit
 * test (queries, routing, branding theme) — extracting these pure
 * presentation components is what makes the tier-aware UX testable
 * at all.
 *
 * Each test focuses on ONE branch / ONE prop so a failure points
 * directly to the broken code path.
 */

const tier = (overrides: Partial<ReplicationConfig> = {}): ReplicationConfig => ({
  tier: "disk_backed",
  ...overrides,
});

describe("ReplicaPickerHeader — section title", () => {
  it('renders "Read Replicas" for T1 disk-backed engines', () => {
    render(<ReplicaPickerHeader replication={tier({ tier: "disk_backed" })} replicaCount={1} />);
    expect(screen.getByTestId("replica-picker-label")).toHaveTextContent(/read replicas/i);
  });

  it('renders "Read Replicas" for T2 in-memory engines (same title — only hint changes)', () => {
    render(<ReplicaPickerHeader replication={tier({ tier: "in_memory" })} replicaCount={1} />);
    expect(screen.getByTestId("replica-picker-label")).toHaveTextContent(/read replicas/i);
  });

  it('renders "Cluster Size" for T3 native-distributed engines', () => {
    render(<ReplicaPickerHeader replication={tier({ tier: "native_distributed" })} replicaCount={3} />);
    expect(screen.getByTestId("replica-picker-label")).toHaveTextContent(/cluster size/i);
  });

  it('renders "Consensus Cluster" for T4 engines', () => {
    render(<ReplicaPickerHeader replication={tier({ tier: "consensus_kv" })} replicaCount={3} />);
    expect(screen.getByTestId("replica-picker-label")).toHaveTextContent(/consensus cluster/i);
  });

  it("falls back to Read Replicas when replication is undefined (legacy engines)", () => {
    render(<ReplicaPickerHeader replication={null} replicaCount={1} />);
    expect(screen.getByTestId("replica-picker-label")).toHaveTextContent(/read replicas/i);
  });
});

describe("ReplicaPickerHeader — hint copy", () => {
  it("hints at primary-only backups for T2 in-memory (cost-saving callout)", () => {
    render(<ReplicaPickerHeader replication={tier({ tier: "in_memory" })} replicaCount={1} />);
    expect(screen.getByTestId("replica-picker-hint")).toHaveTextContent(/primary only/i);
  });

  it("hints at cluster self-replication for T3 native-distributed", () => {
    render(<ReplicaPickerHeader replication={tier({ tier: "native_distributed" })} replicaCount={3} />);
    expect(screen.getByTestId("replica-picker-hint")).toHaveTextContent(/self-replicates/i);
  });

  it("hints at quorum minimum for T4 (default 3 nodes)", () => {
    render(<ReplicaPickerHeader replication={tier({ tier: "consensus_kv" })} replicaCount={3} />);
    expect(screen.getByTestId("replica-picker-hint")).toHaveTextContent(/minimum: 3 nodes/);
  });

  it("respects cluster_minimum override (e.g. 5 for higher availability)", () => {
    render(<ReplicaPickerHeader replication={tier({ tier: "consensus_kv", cluster_minimum: 5 })} replicaCount={5} />);
    expect(screen.getByTestId("replica-picker-hint")).toHaveTextContent(/minimum: 5 nodes/);
  });
});

describe("ReplicaPickerHeader — BYOL badge", () => {
  it("renders the BYOL badge when license_required=true (Oracle Enterprise)", () => {
    render(
      <ReplicaPickerHeader
        replication={tier({ tier: "licensed", license_required: true })}
        replicaCount={1}
      />,
    );
    expect(screen.getByTestId("byol-badge")).toHaveTextContent(/byol/i);
  });

  it("does NOT render the BYOL badge for SQL Server Developer (tier=licensed but license_required=false)", () => {
    // Critical contract: the audit's A2/B1 finding — the badge must
    // track the actual license requirement, not the tier name.
    // SQL Server Developer is the canonical counterexample.
    render(
      <ReplicaPickerHeader
        replication={tier({ tier: "licensed", license_required: false })}
        replicaCount={1}
      />,
    );
    expect(screen.queryByTestId("byol-badge")).not.toBeInTheDocument();
  });

  it("does NOT render the BYOL badge for non-licensed tiers", () => {
    render(<ReplicaPickerHeader replication={tier({ tier: "disk_backed" })} replicaCount={1} />);
    expect(screen.queryByTestId("byol-badge")).not.toBeInTheDocument();
  });
});

describe("ReplicaPickerHeader — WAN-sensitivity warning (T4)", () => {
  it("renders the WAN warning when wan_sensitive is true", () => {
    render(
      <ReplicaPickerHeader
        replication={tier({ tier: "consensus_kv", wan_sensitive: true })}
        replicaCount={3}
      />,
    );
    expect(screen.getByTestId("wan-sensitive-warning")).toBeInTheDocument();
    expect(screen.getByTestId("wan-sensitive-warning")).toHaveTextContent(/sub-100ms/i);
  });

  it("does NOT render the WAN warning when wan_sensitive is unset/false", () => {
    render(<ReplicaPickerHeader replication={tier({ tier: "disk_backed" })} replicaCount={1} />);
    expect(screen.queryByTestId("wan-sensitive-warning")).not.toBeInTheDocument();
  });
});

describe("ReplicaPickerHeader — even-count quorum nudge (T4)", () => {
  it("fires for even node counts ≥ 2 on engines marked recommended_odd", () => {
    render(
      <ReplicaPickerHeader
        replication={tier({ tier: "consensus_kv", recommended_odd: true })}
        replicaCount={4}
      />,
    );
    expect(screen.getByTestId("even-count-warning")).toHaveTextContent(/4 nodes/);
    expect(screen.getByTestId("even-count-warning")).toHaveTextContent(/Consider 3 or 5/);
  });

  it("does NOT fire for replicaCount=1 (sub-quorum input — handled separately by the BE)", () => {
    render(
      <ReplicaPickerHeader
        replication={tier({ tier: "consensus_kv", recommended_odd: true })}
        replicaCount={1}
      />,
    );
    expect(screen.queryByTestId("even-count-warning")).not.toBeInTheDocument();
  });

  it("does NOT fire for odd node counts (3, 5, 7)", () => {
    render(
      <ReplicaPickerHeader
        replication={tier({ tier: "consensus_kv", recommended_odd: true })}
        replicaCount={5}
      />,
    );
    expect(screen.queryByTestId("even-count-warning")).not.toBeInTheDocument();
  });

  it("does NOT fire on engines where recommended_odd is unset", () => {
    render(
      <ReplicaPickerHeader
        replication={tier({ tier: "disk_backed" })}
        replicaCount={4}
      />,
    );
    expect(screen.queryByTestId("even-count-warning")).not.toBeInTheDocument();
  });
});

describe("ReplicaPickerHeader — engine caveats", () => {
  it("renders caveat list items when caveats array is non-empty", () => {
    render(
      <ReplicaPickerHeader
        replication={tier({
          tier: "disk_backed",
          caveats: ["Election latency matters", "Test caveat two"],
        })}
        replicaCount={1}
      />,
    );
    const list = screen.getByTestId("replication-caveats");
    expect(list).toHaveTextContent(/Election latency matters/);
    expect(list).toHaveTextContent(/Test caveat two/);
  });

  it("omits the caveat container entirely when caveats is empty/undefined", () => {
    render(<ReplicaPickerHeader replication={tier({ tier: "disk_backed" })} replicaCount={1} />);
    expect(screen.queryByTestId("replication-caveats")).not.toBeInTheDocument();
  });
});

describe("ReplicaPickerFooter", () => {
  it("renders nothing when no AZs are selected (selectedAzCount=0)", () => {
    const { container } = render(
      <ReplicaPickerFooter
        replication={tier({ tier: "disk_backed" })}
        selectedAzCount={0}
        replicaCount={1}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders "read replicas" copy for T1 disk-backed', () => {
    render(
      <ReplicaPickerFooter
        replication={tier({ tier: "disk_backed" })}
        selectedAzCount={2}
        replicaCount={3}
      />,
    );
    expect(screen.getByTestId("replica-picker-footer")).toHaveTextContent(
      /2 read replicas will be created \(3 total nodes/,
    );
  });

  it('renders "cluster nodes" copy for T3 native-distributed', () => {
    render(
      <ReplicaPickerFooter
        replication={tier({ tier: "native_distributed" })}
        selectedAzCount={2}
        replicaCount={3}
      />,
    );
    expect(screen.getByTestId("replica-picker-footer")).toHaveTextContent(
      /Cluster will have 3 nodes/,
    );
  });

  it('renders "consensus members" copy for T4', () => {
    render(
      <ReplicaPickerFooter
        replication={tier({ tier: "consensus_kv" })}
        selectedAzCount={2}
        replicaCount={3}
      />,
    );
    expect(screen.getByTestId("replica-picker-footer")).toHaveTextContent(
      /3 consensus members/,
    );
  });

  it('uses singular "replica" when exactly one AZ is selected', () => {
    render(
      <ReplicaPickerFooter
        replication={tier({ tier: "disk_backed" })}
        selectedAzCount={1}
        replicaCount={2}
      />,
    );
    expect(screen.getByTestId("replica-picker-footer")).toHaveTextContent(
      /1 read replica will be created/,
    );
    expect(screen.getByTestId("replica-picker-footer")).not.toHaveTextContent(
      /1 read replicas/,
    );
  });
});
