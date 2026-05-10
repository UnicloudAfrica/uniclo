/**
 * MigrationsList — friendly list of workload migrations.
 *
 * Wow refactor:
 *   - Each row leads with a MoodIndicator (😴/🚀/✨/😬/🚨) for at-a-glance scanning
 *   - Status uses orbit StatusBadge with friendly labels ("On its way!" not
 *     "In Progress"); SR-users still hear the canonical state via aria-label
 *   - Source → Target column rendered with an animated arrow that pulses when
 *     migration is in flight
 *   - Progress bar uses the platform theme gradient + smooth width transition
 *   - Empty state via orbit ResourceShell with a friendly illustration + CTA
 *   - Destructive cancel uses orbit ConfirmActionDialog (focus trap, ESC,
 *     friendly verbs) instead of the native window.confirm() prompt
 *   - Refresh button uses platform tokens; row hover lifts subtly
 */
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, ArrowRight, XCircle } from "lucide-react";
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
  useFetchExternalMigrations,
  useCancelExternalMigration,
} from "@/shared/hooks/resources";
import type { ExternalMigration } from "@/shared/hooks/resources/externalMigrationHooks";

interface MigrationsListProps {
  context: "admin" | "tenant" | "client";
  onViewDetails?: (migration: ExternalMigration) => void;
  /** Optional path to the wizard for the empty-state CTA. */
  wizardPath?: string;
}

const TIER_LABELS: Record<string, string> = {
  same_cloud: "Same cloud",
  cross_cloud: "Cross cloud",
  on_prem: "From on-prem",
};

const ACTIVE_STATUSES = ["in_progress", "confirmed", "estimated", "estimating"];

const MigrationsList: React.FC<MigrationsListProps> = ({
  context: _context,
  onViewDetails,
  wizardPath,
}) => {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  const { data: migrations, isLoading, error, refetch } =
    useFetchExternalMigrations();
  const cancelMutation = useCancelExternalMigration();

  const [confirmCancel, setConfirmCancel] = useState<ExternalMigration | null>(null);

  const dataList = useMemo(() => {
    if (!migrations) return [];
    return Array.isArray(migrations) ? migrations : [];
  }, [migrations]);

  const columns: Column<ExternalMigration>[] = useMemo(
    () => [
      // ── Mood column — first thing your eye lands on ─────────────────
      {
        key: "mood",
        header: "",
        render: (_, row) => {
          const fs = friendlyStatus("workload-migration", row.status);
          return (
            <div className="flex items-center justify-center">
              <MoodIndicator mood={fs.mood} size="md" />
            </div>
          );
        },
      },
      // ── ID — small mono code, less visual weight ────────────────────
      {
        key: "identifier",
        header: "ID",
        sortable: true,
        render: (_, row) => (
          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
            {row.identifier.slice(0, 12)}
          </span>
        ),
      },
      // ── Source → Target — the journey ───────────────────────────────
      {
        key: "source_endpoint",
        header: "Where it's going",
        render: (_, row) => {
          const src = row.source_endpoint as { name?: string; provider?: string } | undefined;
          const tgt = row.target_endpoint as { name?: string; provider?: string } | undefined;
          const inFlight = row.status === "in_progress";
          return (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {src?.name ?? src?.provider ?? "Source"}
              </span>
              <span aria-hidden="true" className="flex items-center">
                <ArrowRight
                  size={14}
                  className={[
                    "text-primary-500",
                    inFlight && !reduced ? "animate-pulse" : "",
                  ].join(" ")}
                />
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {tgt?.name ?? tgt?.provider ?? "Target"}
              </span>
            </div>
          );
        },
      },
      // ── Resource type ───────────────────────────────────────────────
      {
        key: "resource_type",
        header: "What",
        sortable: true,
        render: (_, row) => (
          <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
            {row.resource_type}
          </span>
        ),
      },
      // ── Tier ────────────────────────────────────────────────────────
      {
        key: "migration_tier",
        header: "Style",
        render: (_, row) => (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {TIER_LABELS[row.migration_tier ?? ""] ?? row.migration_tier ?? "—"}
          </span>
        ),
      },
      // ── Status (friendly via orbit StatusBadge) ────────────────────
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (_, row) => {
          const fs = friendlyStatus("workload-migration", row.status);
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
      // ── Progress (animated, themed) ────────────────────────────────
      {
        key: "progress_percent",
        header: "Progress",
        render: (_, row) => {
          if (row.status !== "in_progress") {
            if (row.status === "completed") {
              return (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success-700 dark:text-success-400">
                  ✨ All done
                </span>
              );
            }
            return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
          }
          const pct = Math.max(0, Math.min(100, row.progress_percent ?? 0));
          return (
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Migration progress ${pct}%`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
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
      // ── Cost ───────────────────────────────────────────────────────
      {
        key: "estimated_cost_usd",
        header: "Cost",
        render: (_, row) => {
          const cost = row.actual_cost_usd ?? row.estimated_cost_usd;
          if (!cost) return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
          return (
            <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              ${Number(cost).toFixed(2)}
            </span>
          );
        },
      },
      // ── Date — relative + tooltip with absolute ────────────────────
      {
        key: "created_at",
        header: "Started",
        sortable: true,
        render: (_, row) => {
          const date = new Date(row.created_at);
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

  const actions: Action<ExternalMigration>[] = useMemo(
    () => [
      ...(onViewDetails
        ? [
            {
              label: "Open",
              onClick: (row: ExternalMigration) => onViewDetails(row),
            },
          ]
        : []),
      {
        label: "Stop migration",
        icon: <XCircle size={14} />,
        tone: "danger" as const,
        onClick: (row: ExternalMigration) => {
          if (ACTIVE_STATUSES.includes(row.status)) {
            setConfirmCancel(row);
          }
        },
      },
    ],
    [onViewDetails],
  );

  const showEmpty = !isLoading && !error && dataList.length === 0;

  return (
    <div className="space-y-4">
      {/* Header — friendly refresh */}
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
        emptyTitle="No migrations yet"
        emptyDescription="Start your first migration and we'll show every step here — pause, resume, retry, all from this page."
        emptyIcon={<span aria-hidden="true" className="text-5xl">🚚</span>}
        emptyAction={
          wizardPath
            ? { label: "Start a migration", onClick: () => navigate(wizardPath) }
            : undefined
        }
      >
        <ModernTable<ExternalMigration>
          data={dataList}
          columns={columns}
          loading={false}
          searchable
          searchKeys={["identifier", "resource_type", "status"]}
          searchPlaceholder="Find a migration by ID, type, or status…"
          paginated
          pageSize={10}
          actions={actions}
          emptyMessage={null}
        />
      </ResourceShell>

      {/* Friendly cancel confirmation — replaces native window.confirm() */}
      <ConfirmActionDialog
        open={Boolean(confirmCancel)}
        onClose={() => setConfirmCancel(null)}
        onConfirm={async () => {
          if (!confirmCancel) return;
          await cancelMutation.mutateAsync({ migrationId: confirmCancel.identifier });
          setConfirmCancel(null);
        }}
        title="Stop this migration?"
        description={
          confirmCancel
            ? `We'll stop migration ${confirmCancel.identifier} where it is. The target won't be cleaned up — you can keep what's already moved or cancel and restart later.`
            : ""
        }
        severity="danger"
        confirmLabel="Yes, stop it"
        cancelLabel="No, let it finish"
      />
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

export default MigrationsList;
