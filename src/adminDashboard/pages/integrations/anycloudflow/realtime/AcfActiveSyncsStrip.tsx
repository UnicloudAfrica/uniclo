/**
 * AcfActiveSyncsStrip — grid of live sync cards for every replication
 * that is currently syncing or recently started.
 *
 * Uses the existing integration-operations feed (React Query) as the
 * source of truth for "which replications are active right now", then
 * lets each card's realtime subscription drive the per-replication
 * progress updates.
 *
 * Mount this at the top of the DR dashboard (see ProtectionOverview) so
 * operators see live progress for every tenant-wide replication without
 * navigating into a detail page.
 */
import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { useFetchIntegrationOperations } from "@/shared/hooks/resources/integrationHooks";
import type { IntegrationOperation } from "@/shared/hooks/resources/integrationHooks";
import AcfSyncProgressCard from "./AcfSyncProgressCard";

interface ActiveSyncRow {
  /** Replication identifier pulled off the operation record. */
  identifier: string;
  /** Initial snapshot derived from the operation — replaced on first event. */
  initial: {
    phase?: string;
    status?: string;
    percent?: number;
    bytes_transferred?: number;
  };
  subtitle: string;
}

function bytesFromGb(gb?: number): number | undefined {
  if (gb == null || !Number.isFinite(gb)) return undefined;
  return Math.round(gb * 1024 * 1024 * 1024);
}

export function AcfActiveSyncsStrip() {
  const { data, isLoading } = useFetchIntegrationOperations();
  const operations = (data ?? []) as IntegrationOperation[];

  // Filter down to replication-type operations that are in-flight.
  const activeRows = useMemo<ActiveSyncRow[]>(() => {
    return operations
      .filter((op) => {
        const kind = (op.operation_type ?? "").toLowerCase();
        if (!kind.includes("replication") && !kind.includes("sync")) return false;
        const s = (op.status ?? "").toLowerCase();
        return s === "in_progress" || s === "pending" || s === "running";
      })
      .map((op) => {
        // The backend stores the replication identifier on the operation record
        // under `resource_id` (numeric) or the operation's own `identifier`.
        // We prefer `identifier` because it maps directly to the Reverb channel.
        const channelId = String(op.identifier ?? op.resource_id ?? "").trim();
        return {
          identifier: channelId,
          initial: {
            status: op.status,
            phase: op.operation_subtype,
            percent: op.progress_percent,
            bytes_transferred: bytesFromGb(op.data_transferred_gb),
          },
          subtitle: op.operation_subtype
            ? op.operation_subtype.replace(/_/g, " ")
            : "replication",
        } satisfies ActiveSyncRow;
      })
      .filter((r) => r.identifier.length > 0);
  }, [operations]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        <RefreshCw size={14} className="animate-spin" />
        Loading active syncs…
      </div>
    );
  }

  if (activeRows.length === 0) return null;

  return (
    <section
      className="space-y-3"
      aria-label={`Live syncs: ${activeRows.length}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Live syncs
          <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
            {activeRows.length}
          </span>
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {activeRows.map((row) => (
          <AcfSyncProgressCard
            key={row.identifier}
            replicationIdentifier={row.identifier}
            initialData={row.initial}
            title={`Replication ${row.identifier.slice(0, 12)}…`}
            subtitle={row.subtitle}
            compact
          />
        ))}
      </div>
    </section>
  );
}

export default AcfActiveSyncsStrip;
