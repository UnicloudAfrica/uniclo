/**
 * ManagedDatabaseList — Shared list component for managed databases.
 *
 * Used across admin, tenant, and client dashboards via page wrappers.
 */
import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Pause, Play, Trash2 } from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import EngineIcon, { getEngineLabel } from "./EngineIcon";
import DatabaseStatusBadge from "./DatabaseStatusBadge";
import {
  useFetchManagedDatabases,
  useDatabaseAction,
  useDeleteManagedDatabase,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type { ManagedDatabase } from "@/types/managedDatabase";

interface ManagedDatabaseListProps {
  context: "admin" | "tenant" | "client";
  createPath?: string;
  detailBasePath?: string;
}

const ManagedDatabaseList: React.FC<ManagedDatabaseListProps> = ({
  context: _context,
  createPath = "databases/create",
  detailBasePath = "databases",
}) => {
  const navigate = useNavigate();
  const { data: databases, isLoading, refetch } = useFetchManagedDatabases();
  const actionMutation = useDatabaseAction();
  const deleteMutation = useDeleteManagedDatabase();

  const dataList = useMemo(() => {
    if (!databases) return [];
    return Array.isArray(databases) ? databases : [];
  }, [databases]);

  const handleRowClick = useCallback(
    (row: ManagedDatabase) => {
      navigate(`${detailBasePath}/${row.identifier}`);
    },
    [navigate, detailBasePath]
  );

  const columns: Column<ManagedDatabase>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Database",
        sortable: true,
        render: (_, row) => (
          <div className="flex items-center gap-3">
            <EngineIcon engine={row.engine} size={18} />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{row.name}</div>
              <div className="text-xs text-gray-500">{row.identifier}</div>
            </div>
          </div>
        ),
      },
      {
        key: "engine",
        header: "Engine",
        sortable: true,
        render: (_, row) => (
          <div>
            <div className="font-medium">{getEngineLabel(row.engine)}</div>
            <div className="text-xs text-gray-500">v{row.engine_version}</div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (_, row) => <DatabaseStatusBadge status={row.status} />,
      },
      {
        key: "plan_size",
        header: "Plan",
        sortable: true,
        render: (_, row) => (
          <div>
            <div className="font-medium capitalize">{row.plan_size}</div>
            <div className="text-xs text-gray-500">
              {row.vcpu_count} vCPU · {Math.round(row.memory_mb / 1024)}GB
            </div>
          </div>
        ),
      },
      {
        key: "replica_count",
        header: "Replicas",
        align: "center" as const,
        render: (_, row) => (
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm font-medium">{row.replica_count}</span>
            {row.dr_region && (
              <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                DR
              </span>
            )}
          </div>
        ),
      },
      {
        key: "region",
        header: "Region",
        sortable: true,
        render: (_, row) => <span className="text-sm">{row.region}</span>,
      },
      {
        key: "monthly_cost",
        header: "Monthly Cost",
        align: "right" as const,
        sortable: true,
        render: (_, row) => (
          <span className="text-sm font-medium">
            {row.monthly_cost > 0 ? `$${Number(row.monthly_cost).toFixed(2)}` : "—"}
          </span>
        ),
      },
    ],
    []
  );

  const actions: Action<ManagedDatabase>[] = useMemo(
    () => [
      {
        label: "View",
        onClick: handleRowClick,
      },
      {
        label: "Pause",
        icon: <Pause size={14} />,
        onClick: (row) => {
          if (row.status === "active") {
            actionMutation.mutate({ identifier: row.identifier, action: "pause" });
          }
        },
      },
      {
        label: "Resume",
        icon: <Play size={14} />,
        onClick: (row) => {
          if (row.status === "paused") {
            actionMutation.mutate({ identifier: row.identifier, action: "resume" });
          }
        },
      },
      {
        label: "Delete",
        icon: <Trash2 size={14} />,
        tone: "danger" as const,
        onClick: (row) => {
          if (confirm(`Delete database "${row.name}"? This cannot be undone.`)) {
            deleteMutation.mutate({ id: row.identifier });
          }
        },
      },
    ],
    [handleRowClick, actionMutation, deleteMutation]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Managed Databases
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fully managed database clusters on dedicated VMs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => navigate(createPath)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Create Database
          </button>
        </div>
      </div>

      {/* Table */}
      <ModernTable<ManagedDatabase>
        data={dataList}
        columns={columns}
        loading={isLoading}
        searchable
        searchKeys={["name", "identifier", "engine", "region"]}
        searchPlaceholder="Search databases..."
        paginated
        pageSize={10}
        onRowClick={handleRowClick}
        actions={actions}
        emptyMessage={
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No databases found.</p>
            <button
              onClick={() => navigate(createPath)}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Create your first database
            </button>
          </div>
        }
      />
    </div>
  );
};

export default ManagedDatabaseList;
