/**
 * IntegrationOperationsTable — Lists integration operations with status, progress, and cost.
 *
 * Responsive: stacks to card layout on mobile, shows full table on desktop.
 */
import React from "react";
import { Clock } from "lucide-react";
import { ModernTable } from "../ui";
import IntegrationStatusBadge from "./IntegrationStatusBadge";
import type { IntegrationOperation } from "@/shared/hooks/resources/integrationHooks";

interface IntegrationOperationsTableProps {
  operations: IntegrationOperation[];
  loading?: boolean;
  compact?: boolean;
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCost = (cost?: number): string => {
  if (cost === undefined || cost === null || cost === 0) return "—";
  return `$${cost.toFixed(2)}`;
};

const operationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    backup: "Backup",
    restore: "Restore",
    migration: "Migration",
    failover: "Failover",
    failback: "Failback",
    dr_drill: "DR Drill",
  };
  return labels[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const IntegrationOperationsTable: React.FC<IntegrationOperationsTableProps> = ({
  operations,
  loading = false,
  compact = false,
}) => {
  const columns = [
    {
      key: "identifier",
      header: "ID",
      render: (_: unknown, row: IntegrationOperation) => (
        <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
          {row.identifier}
        </span>
      ),
    },
    {
      key: "operation_type",
      header: "Type",
      render: (_: unknown, row: IntegrationOperation) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {operationTypeLabel(row.operation_type)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (_: unknown, row: IntegrationOperation) => (
        <IntegrationStatusBadge status={row.status} />
      ),
    },
    ...(compact
      ? []
      : [
          {
            key: "progress_percent",
            header: "Progress",
            render: (_: unknown, row: IntegrationOperation) => {
              if (row.status === "completed") {
                return <span className="text-green-600 dark:text-green-400">100%</span>;
              }
              if (row.status === "failed" || row.status === "cancelled") {
                return <span className="text-gray-400">—</span>;
              }
              return (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-gray-700 sm:w-20">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${row.progress_percent ?? 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{row.progress_percent ?? 0}%</span>
                </div>
              );
            },
          },
          {
            key: "actual_cost_usd",
            header: "Cost",
            render: (_: unknown, row: IntegrationOperation) => (
              <span className="text-gray-700 dark:text-gray-300">
                {formatCost(row.actual_cost_usd)}
              </span>
            ),
          },
        ]),
    {
      key: "created_at",
      header: "Date",
      render: (_: unknown, row: IntegrationOperation) => (
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock size={12} />
          {formatDate(row.created_at)}
        </span>
      ),
    },
  ];

  if (!operations.length && !loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center dark:border-gray-700 sm:py-12">
        <span aria-hidden="true" className="text-4xl">🌱</span>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Quiet so far
        </p>
        <p className="max-w-sm text-xs text-gray-500 dark:text-gray-400">
          Backups, replications, and migrations show up here as they happen. Start one and watch this fill up.
        </p>
      </div>
    );
  }

  return (
    <ModernTable<IntegrationOperation>
      data={operations}
      columns={columns}
      loading={loading}
      searchable={!compact}
      searchKeys={["identifier", "operation_type", "status"]}
      searchPlaceholder="Search operations..."
      paginated={!compact}
      pageSize={compact ? 5 : 10}
    />
  );
};

export default IntegrationOperationsTable;
