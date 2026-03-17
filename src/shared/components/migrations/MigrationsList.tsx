/**
 * MigrationsList — Shared table listing external migrations for MaaS.
 *
 * Used across admin, tenant, and client dashboards.
 */
import React, { useMemo } from "react";
import { RefreshCw, ArrowRight, Search, XCircle } from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import MigrationStatusBadge from "./MigrationStatusBadge";
import {
  useFetchExternalMigrations,
  useCancelExternalMigration,
} from "@/shared/hooks/resources";
import type { ExternalMigration } from "@/shared/hooks/resources/externalMigrationHooks";

interface MigrationsListProps {
  context: "admin" | "tenant" | "client";
  onViewDetails?: (migration: ExternalMigration) => void;
}

const TIER_LABELS: Record<string, string> = {
  same_cloud: "Same Cloud",
  cross_cloud: "Cross Cloud",
  on_prem: "On-Prem",
};

const MigrationsList: React.FC<MigrationsListProps> = ({
  context: _context,
  onViewDetails,
}) => {
  const { data: migrations, isLoading, refetch } = useFetchExternalMigrations();
  const cancelMutation = useCancelExternalMigration();

  const dataList = useMemo(() => {
    if (!migrations) return [];
    return Array.isArray(migrations) ? migrations : [];
  }, [migrations]);

  const columns: Column<ExternalMigration>[] = useMemo(
    () => [
      {
        key: "identifier",
        header: "ID",
        sortable: true,
        render: (_, row) => (
          <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
            {row.identifier}
          </span>
        ),
      },
      {
        key: "source_endpoint",
        header: "Source → Target",
        render: (_, row) => {
          const src = row.source_endpoint as
            | { name?: string; provider?: string }
            | undefined;
          const tgt = row.target_endpoint as
            | { name?: string; provider?: string }
            | undefined;
          return (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                {src?.name ?? src?.provider ?? "Source"}
              </span>
              <ArrowRight size={12} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">
                {tgt?.name ?? tgt?.provider ?? "Target"}
              </span>
            </div>
          );
        },
      },
      {
        key: "resource_type",
        header: "Type",
        sortable: true,
        render: (_, row) => (
          <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
            {row.resource_type}
          </span>
        ),
      },
      {
        key: "migration_tier",
        header: "Tier",
        render: (_, row) => (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {TIER_LABELS[row.migration_tier ?? ""] ?? row.migration_tier ?? "—"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (_, row) => <MigrationStatusBadge status={row.status} />,
      },
      {
        key: "progress_percent",
        header: "Progress",
        render: (_, row) => {
          if (row.status !== "in_progress") {
            return (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                —
              </span>
            );
          }
          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${row.progress_percent}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {row.progress_percent}%
              </span>
            </div>
          );
        },
      },
      {
        key: "estimated_cost_usd",
        header: "Cost",
        render: (_, row) => {
          const cost = row.actual_cost_usd ?? row.estimated_cost_usd;
          if (!cost) {
            return (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                —
              </span>
            );
          }
          return (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ${Number(cost).toFixed(2)}
            </span>
          );
        },
      },
      {
        key: "created_at",
        header: "Date",
        sortable: true,
        render: (_, row) => {
          const date = new Date(row.created_at);
          return (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {date.toLocaleDateString()}
            </span>
          );
        },
      },
    ],
    [],
  );

  const actions: Action<ExternalMigration>[] = useMemo(
    () => [
      ...(onViewDetails
        ? [
            {
              label: "View",
              onClick: (row: ExternalMigration) => onViewDetails(row),
            },
          ]
        : []),
      {
        label: "Cancel",
        icon: <XCircle size={14} />,
        tone: "danger" as const,
        onClick: (row: ExternalMigration) => {
          if (
            ["in_progress", "confirmed", "estimated"].includes(row.status) &&
            confirm(`Cancel migration ${row.identifier}?`)
          ) {
            cancelMutation.mutate({ migrationId: row.identifier });
          }
        },
      },
    ],
    [onViewDetails, cancelMutation],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => refetch()}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <ModernTable<ExternalMigration>
        data={dataList}
        columns={columns}
        loading={isLoading}
        searchable
        searchKeys={["identifier", "resource_type", "status"]}
        searchPlaceholder="Search migrations..."
        paginated
        pageSize={10}
        actions={actions}
        emptyMessage={
          <div className="flex flex-col items-center py-12 text-center">
            <Search
              size={40}
              className="mb-3 text-gray-300 dark:text-gray-600"
            />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No migrations yet
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Start a new migration to transfer data between servers.
            </p>
          </div>
        }
      />
    </div>
  );
};

export default MigrationsList;
