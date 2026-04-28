/**
 * AttackHistoryTable — Historical attack data for a Shield domain.
 */
import React, { useMemo } from "react";
import { RefreshCw, Shield } from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column } from "@/shared/components/ui/ModernTable/types";
import StatusPill from "@/shared/components/ui/StatusPill";
import { useFetchAttacks } from "@/shared/hooks/resources/shieldHooks";
import type { ShieldAttack } from "@/shared/hooks/resources/shieldHooks";

interface AttackHistoryTableProps {
  domainId: string;
}

const STATUS_TONE: Record<string, "success" | "danger" | "warning" | "info"> = {
  mitigated: "success",
  active: "danger",
  ongoing: "danger",
  detected: "warning",
};

const AttackHistoryTable: React.FC<AttackHistoryTableProps> = ({ domainId }) => {
  const { data: attacks = [], isLoading, isError, error, refetch } = useFetchAttacks(domainId);

  const columns: Column<ShieldAttack>[] = useMemo(
    () => [
      { key: "type", header: "Type", sortable: true },
      {
        key: "start_time",
        header: "Started",
        sortable: true,
        render: (_, row) => new Date(row.start_time).toLocaleString(),
      },
      {
        key: "end_time",
        header: "Ended",
        render: (_, row) =>
          row.end_time ? new Date(row.end_time).toLocaleString() : "Ongoing",
      },
      {
        key: "peak_bandwidth",
        header: "Peak",
        render: (_, row) =>
          row.peak_bandwidth
            ? `${(row.peak_bandwidth / 1_000_000).toFixed(1)} Mbps`
            : "—",
      },
      {
        key: "status",
        header: "Status",
        render: (_, row) => (
          <StatusPill
            status={row.status}
            tone={STATUS_TONE[row.status] ?? "neutral"}
          />
        ),
      },
    ],
    []
  );

  if (isError) {
    return (
      <div className="db-surface-card flex flex-col items-center justify-center gap-3 rounded-2xl border p-8 text-center">
        <Shield size={32} className="text-red-400" />
        <p className="text-sm text-red-600">
          {error?.message || "Failed to load attack history."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="db-surface-card rounded-2xl border p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
        Attack History
      </h3>
      <ModernTable<ShieldAttack>
        columns={columns}
        data={attacks as ShieldAttack[]}
        loading={isLoading}
        searchKeys={["type", "status"]}
        searchPlaceholder="Search attacks..."
        emptyState={{
          title: "No attacks recorded",
          description: "Your domain has not experienced any detected attacks.",
        }}
      />
    </div>
  );
};

export default AttackHistoryTable;
