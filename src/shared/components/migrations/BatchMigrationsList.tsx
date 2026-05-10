/**
 * BatchMigrationsList — friendly batch-migration list view.
 *
 * Wow refactor: same pattern as MigrationsList.
 *   - MoodIndicator column for at-a-glance scanning
 *   - Friendly StatusBadge labels (mapped via orbit `friendlyStatus`)
 *   - Themed gradient progress bar with smooth-width transition
 *   - Friendly empty state via ResourceShell with 📦 illustration
 *   - Pause / Resume / Cancel use AsyncButton-style feedback via mutations
 *   - Cancel uses ConfirmActionDialog with friendly verbs (no native confirm)
 */
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Eye, Pause, Play, XCircle } from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import {
  MoodIndicator,
  StatusBadge,
  ResourceShell,
  ConfirmActionDialog,
  AsyncButton,
  friendlyStatus,
  usePrefersReducedMotion,
  orbitTransition,
} from "@/shared/components/orbit";
import {
  useBatchMigrations,
  usePauseBatchMigration,
  useResumeBatchMigration,
  useCancelBatchMigration,
} from "@/shared/hooks/resources";

type AnyRecord = Record<string, unknown>;

interface BatchMigrationsListProps {
  context: "admin" | "tenant" | "client";
  onViewDetails?: (batch: AnyRecord) => void;
  /** Optional path to the wizard for the empty-state CTA. */
  wizardPath?: string;
}

const BatchMigrationsList: React.FC<BatchMigrationsListProps> = ({
  context: _context,
  onViewDetails,
  wizardPath,
}) => {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const { data: raw, isLoading, error, refetch } = useBatchMigrations();
  const pauseMutation = usePauseBatchMigration();
  const resumeMutation = useResumeBatchMigration();
  const cancelMutation = useCancelBatchMigration();

  const [confirmCancel, setConfirmCancel] = useState<AnyRecord | null>(null);

  const dataList = useMemo(() => {
    if (!raw) return [];
    const list = (raw as AnyRecord).data ?? raw;
    return Array.isArray(list) ? (list as AnyRecord[]) : [];
  }, [raw]);

  const columns: Column<AnyRecord>[] = useMemo(
    () => [
      // ── Mood ────────────────────────────────────────────────────────
      {
        key: "mood",
        header: "",
        render: (_, row) => {
          const fs = friendlyStatus("batch-migration", String(row.status ?? ""));
          return (
            <div className="flex items-center justify-center">
              <MoodIndicator mood={fs.mood} size="md" />
            </div>
          );
        },
      },
      // ── Name ────────────────────────────────────────────────────────
      {
        key: "name",
        header: "Batch name",
        sortable: true,
        render: (_, row) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {String(row.name ?? row.identifier ?? "Untitled batch")}
          </span>
        ),
      },
      // ── Status (friendly) ──────────────────────────────────────────
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (_, row) => {
          const fs = friendlyStatus("batch-migration", String(row.status ?? ""));
          return (
            <StatusBadge
              tone={fs.tone}
              label={fs.technical}
              friendlyLabel={fs.friendly}
              size="sm"
            />
          );
        },
      },
      // ── Strategy ────────────────────────────────────────────────────
      {
        key: "strategy",
        header: "Strategy",
        sortable: true,
        render: (_, row) => (
          <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
            {String(row.strategy ?? "—")}
          </span>
        ),
      },
      // ── Progress (animated, themed, status-aware color) ────────────
      {
        key: "progress_percent",
        header: "Progress",
        render: (_, row) => {
          const pct = Math.max(0, Math.min(100, Number(row.progress_percent ?? 0)));
          const status = String(row.status ?? "");
          if (!["running", "paused", "completed", "partial_failure"].includes(status)) {
            return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
          }
          const fillClass =
            status === "completed"
              ? "bg-gradient-to-r from-success-500 to-success-400"
              : status === "paused"
              ? "bg-gradient-to-r from-warning-500 to-warning-400"
              : status === "partial_failure"
              ? "bg-gradient-to-r from-warning-500 to-danger-400"
              : "bg-gradient-to-r from-primary-500 to-secondary-500";
          return (
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Batch migration progress ${pct}%`}
              >
                <div
                  className={`h-full rounded-full ${fillClass}`}
                  style={{
                    width: `${pct}%`,
                    transition: orbitTransition(reduced, "width", "smooth", "decelerate"),
                  }}
                />
              </div>
              <span className="text-xs font-medium tabular-nums text-gray-700 dark:text-gray-300">
                {pct}%
              </span>
            </div>
          );
        },
      },
      // ── VM count "x of y" ──────────────────────────────────────────
      {
        key: "vms",
        header: "Servers",
        render: (_, row) => {
          const completed = Number(row.completed_jobs ?? 0);
          const total = Number(row.total_jobs ?? 0);
          if (total === 0) return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
          return (
            <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">
              <strong className="text-gray-900 dark:text-gray-100">{completed}</strong>
              <span className="text-gray-400 dark:text-gray-500"> of {total}</span>
            </span>
          );
        },
      },
      // ── Date — relative ────────────────────────────────────────────
      {
        key: "created_at",
        header: "Started",
        sortable: true,
        render: (_, row) => {
          if (!row.created_at) return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
          const date = new Date(String(row.created_at));
          return (
            <span
              className="text-xs text-gray-500 dark:text-gray-400"
              title={date.toLocaleString()}
            >
              {formatRelative(date)}
            </span>
          );
        },
      },
    ],
    [reduced],
  );

  const actions: Action<AnyRecord>[] = useMemo(
    () => [
      {
        label: "Open",
        icon: <Eye size={14} />,
        onClick: (row: AnyRecord) => {
          if (onViewDetails) onViewDetails(row);
          else navigate(String(row.identifier ?? row.id ?? ""));
        },
      },
      {
        label: "Pause",
        icon: <Pause size={14} />,
        onClick: (row: AnyRecord) => {
          if (String(row.status) === "running") {
            pauseMutation.mutate({ identifier: String(row.identifier ?? row.id) });
          }
        },
      },
      {
        label: "Resume",
        icon: <Play size={14} />,
        onClick: (row: AnyRecord) => {
          if (String(row.status) === "paused") {
            resumeMutation.mutate({ identifier: String(row.identifier ?? row.id) });
          }
        },
      },
      {
        label: "Stop batch",
        icon: <XCircle size={14} />,
        tone: "danger" as const,
        onClick: (row: AnyRecord) => {
          if (["running", "paused"].includes(String(row.status))) {
            setConfirmCancel(row);
          }
        },
      },
    ],
    [onViewDetails, navigate, pauseMutation, resumeMutation],
  );

  const showEmpty = !isLoading && !error && dataList.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <AsyncButton
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={14} />}
          loadingLabel="Refreshing…"
          successLabel="Up to date"
          onClick={async () => {
            await refetch();
          }}
        >
          Refresh
        </AsyncButton>
      </div>

      <ResourceShell
        loading={isLoading}
        error={error}
        onRetry={refetch}
        empty={showEmpty}
        emptyTitle="No batches yet"
        emptyDescription="Group several servers into a batch and we'll move them together — same target, same schedule, all in one place."
        emptyIcon={<span aria-hidden="true" className="text-5xl">📦</span>}
        emptyAction={
          wizardPath
            ? { label: "Create a batch", onClick: () => navigate(wizardPath) }
            : undefined
        }
      >
        <ModernTable<AnyRecord>
          data={dataList}
          columns={columns}
          loading={false}
          searchable
          searchKeys={["name", "identifier", "strategy", "status"]}
          searchPlaceholder="Find a batch by name, strategy, or status…"
          paginated
          pageSize={10}
          actions={actions}
          onRowClick={(row) => {
            if (onViewDetails) onViewDetails(row);
            else navigate(String(row.identifier ?? row.id ?? ""));
          }}
          emptyMessage={null}
        />
      </ResourceShell>

      <ConfirmActionDialog
        open={Boolean(confirmCancel)}
        onClose={() => setConfirmCancel(null)}
        onConfirm={async () => {
          if (!confirmCancel) return;
          await cancelMutation.mutateAsync({
            identifier: String(confirmCancel.identifier ?? confirmCancel.id),
          });
          setConfirmCancel(null);
        }}
        title="Stop the whole batch?"
        description={
          confirmCancel
            ? `We'll stop "${String(confirmCancel.name ?? confirmCancel.identifier ?? "this batch")}" and all the servers inside it. Servers already moved stay where they are; in-flight ones will halt.`
            : ""
        }
        severity="danger"
        confirmLabel="Yes, stop the batch"
        cancelLabel="No, keep going"
      />
    </div>
  );
};

function formatRelative(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default BatchMigrationsList;
