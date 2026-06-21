import React from "react";
import type { ReplicationConfig } from "@/types/managedDatabase";

/**
 * Per-tier copy + warnings rendered above the replica AZ multi-select.
 *
 * The shape is intentionally minimal so this can be vitested without
 * the parent wizard's huge dependency graph (queries, contexts, etc.).
 * Pure props in → DOM out. The parent owns:
 *
 *   - The actual AZ selection state (`form.replicaAzs`, `toggleReplicaAz`)
 *   - The AZ option list
 *   - The submit guard
 *
 * This component owns:
 *
 *   - Tier-specific section title ("Read Replicas" vs "Cluster Size" vs
 *     "Consensus Cluster")
 *   - The body hint copy
 *   - WAN-sensitivity warning (T4)
 *   - Even-count quorum nudge (T4)
 *   - Per-engine caveats from the catalog
 *   - BYOL badge (only when license_required, NOT when tier=licensed —
 *     SQL Server Developer is `tier=licensed` but `license_required=false`)
 *
 * Why a separate component: the original IIFE inside
 * `DatabaseCreationWizard.tsx` was unreachable from tests because the
 * wizard requires a wall of mocks (queries, routing, branding theme).
 * Extracting the pure render lets `ReplicaPickerHeader.test.tsx`
 * exercise every tier branch + warning combination in milliseconds.
 */

export interface ReplicaPickerHeaderProps {
  replication: ReplicationConfig | undefined | null;
  /**
   * Currently-selected node count INCLUDING the primary. The wizard
   * stores this as `form.replicaCount` (primary + replicas).
   */
  replicaCount: number;
  /** Optional override for the section title. Defaults derive from tier. */
  titleOverride?: string;
  /** Optional override for the body hint. Defaults derive from tier. */
  hintOverride?: string;
}

const ReplicaPickerHeader: React.FC<ReplicaPickerHeaderProps> = ({
  replication,
  replicaCount,
  titleOverride,
  hintOverride,
}) => {
  const tier = replication?.tier ?? null;
  const isClusterMode = tier === "native_distributed";
  const isConsensus = tier === "consensus_kv";
  const isInMemory = tier === "in_memory";
  // BYOL banner tracks license_required, NOT tier === "licensed":
  // SQL Server Developer has tier=licensed but license_required=false
  // because it's the free dev/test edition.
  const isByolBadged = Boolean(replication?.license_required);
  const clusterMin = replication?.cluster_minimum ?? 3;
  const wanSensitive = Boolean(replication?.wan_sensitive);
  const recommendedOdd = Boolean(replication?.recommended_odd);
  const caveats = replication?.caveats ?? [];

  const defaultTitle = isClusterMode
    ? "Cluster Size"
    : isConsensus
      ? "Consensus Cluster"
      : "Read Replicas";

  const defaultHint = isClusterMode
    ? "This engine self-replicates across nodes. Each selected zone adds one cluster member."
    : isConsensus
      ? `Quorum-based KV store. Recommended minimum: ${clusterMin} nodes (odd numbers preferred for split-brain tolerance).`
      : isInMemory
        ? "In-memory replication. Each replica streams from the primary; backups are taken once on the primary only (no double-billing)."
        : "Select availability zones to place read replicas. Each selected AZ gets one replica for high availability.";

  return (
    <>
      <label
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        data-testid="replica-picker-label"
      >
        {titleOverride ?? defaultTitle}
        {isByolBadged && (
          <span
            className="ml-2 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400"
            data-testid="byol-badge"
          >
            BYOL
          </span>
        )}
      </label>
      <p
        className="mb-3 text-xs text-gray-500 dark:text-gray-400"
        data-testid="replica-picker-hint"
      >
        {hintOverride ?? defaultHint}
      </p>

      {wanSensitive && (
        <div
          className="mb-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300"
          data-testid="wan-sensitive-warning"
        >
          <strong className="block mb-1">Quorum requires low latency.</strong>
          This engine uses Raft consensus and needs sub-100ms RTT between nodes.
          Spreading members across regions or providers will cause routine
          quorum loss. Same-region only is strongly recommended.
        </div>
      )}

      {recommendedOdd && replicaCount > 1 && replicaCount % 2 === 0 && (
        <div
          className="mb-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300"
          data-testid="even-count-warning"
        >
          Even-numbered cluster sizes ({replicaCount} nodes) provide no extra
          fault-tolerance over the next-lower odd count. Consider {replicaCount - 1} or {replicaCount + 1}.
        </div>
      )}

      {caveats.length > 0 && (
        <ul
          className="mb-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1"
          data-testid="replication-caveats"
        >
          {caveats.map((caveat, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span aria-hidden="true">ℹ️</span>
              <span>{caveat}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

/**
 * Footer status line for the picker — "N replicas will be created" /
 * "Cluster will have N nodes". Reused by both the wizard summary and
 * the picker body.
 */
export interface ReplicaPickerFooterProps {
  replication: ReplicationConfig | undefined | null;
  selectedAzCount: number;
  replicaCount: number;
}

export const ReplicaPickerFooter: React.FC<ReplicaPickerFooterProps> = ({
  replication,
  selectedAzCount,
  replicaCount,
}) => {
  if (selectedAzCount <= 0) {
    return null;
  }
  const tier = replication?.tier ?? null;
  const isClusterMode = tier === "native_distributed";
  const isConsensus = tier === "consensus_kv";

  const copy = isClusterMode
    ? `Cluster will have ${replicaCount} nodes (each a full peer; engine self-replicates)`
    : isConsensus
      ? `${replicaCount} consensus members will form the cluster`
      : `${selectedAzCount} read replica${selectedAzCount !== 1 ? "s" : ""} will be created (${replicaCount} total nodes including primary)`;

  return (
    <p
      className="mt-2 text-xs text-blue-600 dark:text-blue-400"
      data-testid="replica-picker-footer"
    >
      {copy}
    </p>
  );
};

export default ReplicaPickerHeader;
