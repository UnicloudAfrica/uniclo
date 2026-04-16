/**
 * DatabaseCostCard -- Compact cost summary for embedding in a database detail page.
 *
 * Shows current month cost, daily average, projected total,
 * and a mini cost breakdown by dimension. Includes a link
 * to the full billing view.
 */
import React, { useMemo } from "react";
import { DollarSign, TrendingUp, BarChart3, ArrowRight, Loader2 } from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import { useFetchDatabaseCostEstimate } from "@/shared/hooks/resources/managedDatabaseHooks";

// ── Types ────────────────────────────────────────────────────────

type Identifier = string | number;

// ── Dimension Colors ─────────────────────────────────────────────

const DIMENSION_DISPLAY: Record<string, { label: string; color: string }> = {
  compute_hours: { label: "Compute", color: "bg-blue-500" },
  storage_gb_hours: { label: "Storage", color: "bg-emerald-500" },
  iops_read: { label: "Read I/O", color: "bg-amber-500" },
  iops_write: { label: "Write I/O", color: "bg-orange-500" },
  data_transfer_in_gb: { label: "Ingress", color: "bg-purple-500" },
  data_transfer_out_gb: { label: "Egress", color: "bg-violet-500" },
  backup_storage_gb_hours: { label: "Backup", color: "bg-cyan-500" },
  replica_compute_hours: { label: "Replica", color: "bg-rose-500" },
};

// ── Helpers ──────────────────────────────────────────────────────

const formatCurrency = (val: number): string => {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  if (val >= 1) return `$${val.toFixed(2)}`;
  if (val > 0) return `$${val.toFixed(4)}`;
  return "$0.00";
};

// ── Component ────────────────────────────────────────────────────

interface DatabaseCostCardProps {
  identifier: Identifier;
  billingPath?: string;
  onNavigate?: () => void;
}

const DatabaseCostCard: React.FC<DatabaseCostCardProps> = ({
  identifier,
  billingPath,
  onNavigate,
}) => {
  const { data: costEstimate, isLoading } = useFetchDatabaseCostEstimate(identifier);

  const estimate = costEstimate as Record<string, unknown> | undefined;
  const totalCost = Number(estimate?.total_cost ?? 0);
  const projectedCost = Number(estimate?.projected_monthly_cost ?? 0);
  const daysElapsed = Number(estimate?.days_elapsed ?? 1);
  const dailyAverage = daysElapsed > 0 ? totalCost / daysElapsed : 0;

  const dimensions = (estimate?.dimensions ?? {}) as Record<
    string,
    { total_cost: number; quantity: number }
  >;

  const sortedDimensions = useMemo(() => {
    return Object.entries(dimensions)
      .filter(([, v]) => v.total_cost > 0)
      .sort(([, a], [, b]) => b.total_cost - a.total_cost);
  }, [dimensions]);

  const maxDimCost = sortedDimensions.length > 0 ? sortedDimensions[0][1].total_cost : 1;

  if (isLoading) {
    return (
      <ModernCard className="p-5">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading costs...</span>
        </div>
      </ModernCard>
    );
  }

  return (
    <ModernCard className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-emerald-500" />
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Monthly Cost
          </h4>
        </div>
        {(billingPath || onNavigate) && (
          <button
            onClick={onNavigate}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            View details
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      {/* Cost Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] uppercase text-gray-400 dark:text-gray-500 mb-0.5">Current</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(totalCost)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-gray-400 dark:text-gray-500 mb-0.5">Daily Avg</p>
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
            {formatCurrency(dailyAverage)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-gray-400 dark:text-gray-500 mb-0.5 flex items-center gap-0.5">
            <TrendingUp size={10} />
            Projected
          </p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(projectedCost)}
          </p>
        </div>
      </div>

      {/* Mini Dimension Breakdown */}
      {sortedDimensions.length > 0 && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-gray-400 dark:text-gray-500">
            <BarChart3 size={10} />
            <span>Breakdown</span>
          </div>

          {sortedDimensions.slice(0, 5).map(([dim, data]) => {
            const display = DIMENSION_DISPLAY[dim] ?? {
              label: dim,
              color: "bg-gray-500",
            };
            const widthPct = Math.max((data.total_cost / maxDimCost) * 100, 3);

            return (
              <div key={dim} className="flex items-center gap-2">
                <span className="w-14 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {display.label}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${display.color} transition-all duration-500`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="w-14 text-right text-[11px] font-mono text-gray-600 dark:text-gray-400">
                  {formatCurrency(data.total_cost)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </ModernCard>
  );
};

export default DatabaseCostCard;
