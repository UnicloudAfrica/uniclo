/**
 * BatchMigrationsList -- Table listing batch migrations with actions.
 *
 * Columns: Name, Status, Strategy, Progress, VMs, Created.
 * Row actions: View Details, Pause, Resume, Cancel.
 */
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw,
  Search,
  Eye,
  Pause,
  Play,
  XCircle,
} from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import IntegrationStatusBadge from "../integrations/IntegrationStatusBadge";
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
}

const BatchMigrationsList: React.FC<BatchMigrationsListProps> = ({
  context: _context,
  onViewDetails,
}) => {
  const navigate = useNavigate();
  const { data: raw, isLoading, refetch } = useBatchMigrations();
  const pauseMutation = usePauseBatchMigration();
  const resumeMutation = useResumeBatchMigration();
  const cancelMutation = useCancelBatchMigration();

  const dataList = useMemo(() => {
    if (!raw) return [];
    const list = (raw as AnyRecord).data ?? raw;
    return Array.isArray(list) ? (list as AnyRecord[]) : [];
  }, [raw]);

  const columns: Column<AnyRecord>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (_, row) => (
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {String(row.name ?? row.identifier ?? "Untitled")}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (_, row) => (
          <IntegrationStatusBadge status={String(row.status ?? "pending")} />
        ),
      },
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
      {
        key: "progress_percent",
        header: "Progress",
        render: (_, row) => {
          const pct = Number(row.progress_percent ?? 0);
          const status = String(row.status ?? "");
          if (!["in_progress", "paused"].includes(status) && status !== "completed") {
            return (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                --
              </span>
            );
          }
          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all ${
                    status === "completed"
                      ? "bg-green-500"
                      : status === "paused"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {pct}%
              </span>
            </div>
          );
        },
      },
      {
        key: "vms",
        header: "VMs",
        render: (_, row) => {
          const completed = Number(row.completed_jobs ?? 0);
          const total = Number(row.total_jobs ?? 0);
          return (
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {completed}/{total}
            </span>
          );
        },
      },
      {
        key: "created_at",
        header: "Created",
        sortable: true,
        render: (_, row) => {
          if (!row.created_at) {
            return (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                --
              </span>
            );
          }
          const date = new Date(String(row.created_at));
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

  const actions: Action<AnyRecord>[] = useMemo(
    () => [
      {
        label: "View Details",
        icon: <Eye size={14} />,
        onClick: (row: AnyRecord) => {
          if (onViewDetails) {
            onViewDetails(row);
          } else {
            navigate(String(row.identifier ?? row.id ?? ""));
          }
        },
      },
      {
        label: "Pause",
        icon: <Pause size={14} />,
        onClick: (row: AnyRecord) => {
          const status = String(row.status ?? "");
          if (status === "in_progress") {
            pauseMutation.mutate({
              identifier: String(row.identifier ?? row.id),
            });
          }
        },
      },
      {
        label: "Resume",
        icon: <Play size={14} />,
        onClick: (row: AnyRecord) => {
          const status = String(row.status ?? "");
          if (status === "paused") {
            resumeMutation.mutate({
              identifier: String(row.identifier ?? row.id),
            });
          }
        },
      },
      {
        label: "Cancel",
        icon: <XCircle size={14} />,
        tone: "danger" as const,
        onClick: (row: AnyRecord) => {
          const status = String(row.status ?? "");
          if (
            ["in_progress", "paused"].includes(status) &&
            confirm(`Cancel batch migration "${row.name ?? row.identifier}"?`)
          ) {
            cancelMutation.mutate({
              identifier: String(row.identifier ?? row.id),
            });
          }
        },
      },
    ],
    [onViewDetails, navigate, pauseMutation, resumeMutation, cancelMutation],
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

      <ModernTable<AnyRecord>
        data={dataList}
        columns={columns}
        loading={isLoading}
        searchable
        searchKeys={["name", "identifier", "strategy", "status"]}
        searchPlaceholder="Search batch migrations..."
        paginated
        pageSize={10}
        actions={actions}
        onRowClick={(row) => {
          if (onViewDetails) {
            onViewDetails(row);
          } else {
            navigate(String(row.identifier ?? row.id ?? ""));
          }
        }}
        emptyMessage={
          <div className="flex flex-col items-center py-12 text-center">
            <Search
              size={40}
              className="mb-3 text-gray-300 dark:text-gray-600"
            />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No batch migrations yet
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Create a batch migration to migrate multiple VMs at once.
            </p>
          </div>
        }
      />
    </div>
  );
};

export default BatchMigrationsList;
