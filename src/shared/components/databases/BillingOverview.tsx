/**
 * BillingOverview -- Organization-level billing dashboard.
 *
 * Shows summary cards (current month cost, projected, MoM change),
 * top databases by cost, cost breakdown by dimension (horizontal bars),
 * export CSV button, and period selector. CSS-only charts with Tailwind.
 */
import React, { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Database,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchBillingCurrentMonth,
  useFetchBillingCostBreakdown,
  useExportBillingCsv,
} from "@/shared/hooks/resources/managedDatabaseHooks";

// ── Types ────────────────────────────────────────────────────────

type PeriodPreset = "7d" | "30d" | "90d" | "mtd";

interface DatabaseCostItem {
  database_id: number;
  database_name: string;
  engine: string | null;
  total_cost: number;
}

interface DimensionCost {
  total_cost: number;
  total_quantity: number;
}

// ── Dimension Config ─────────────────────────────────────────────

const DIMENSION_DISPLAY: Record<string, { label: string; color: string; bgColor: string }> = {
  compute_hours: { label: "Compute", color: "bg-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  storage_gb_hours: { label: "Storage", color: "bg-emerald-500", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  iops_read: { label: "Read I/O", color: "bg-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  iops_write: { label: "Write I/O", color: "bg-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  data_transfer_in_gb: { label: "Ingress", color: "bg-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  data_transfer_out_gb: { label: "Egress", color: "bg-violet-500", bgColor: "bg-violet-100 dark:bg-violet-900/30" },
  backup_storage_gb_hours: { label: "Backup", color: "bg-cyan-500", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
  replica_compute_hours: { label: "Replica", color: "bg-rose-500", bgColor: "bg-rose-100 dark:bg-rose-900/30" },
};

// ── Helpers ──────────────────────────────────────────────────────

const formatCurrency = (val: number): string => {
  if (val >= 10000) return `$${(val / 1000).toFixed(1)}k`;
  if (val >= 1) return `$${val.toFixed(2)}`;
  if (val > 0) return `$${val.toFixed(4)}`;
  return "$0.00";
};

const getDateRange = (preset: PeriodPreset): { start: string; end: string } => {
  const end = new Date();
  const start = new Date();
  if (preset === "mtd") {
    start.setDate(1);
  } else {
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    start.setDate(start.getDate() - days);
  }
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
};

// ── Component ────────────────────────────────────────────────────

const BillingOverview: React.FC = () => {
  const [period, setPeriod] = useState<PeriodPreset>("mtd");
  const dateRange = useMemo(() => getDateRange(period), [period]);

  const {
    data: currentMonthData,
    isLoading: monthLoading,
  } = useFetchBillingCurrentMonth();

  const {
    data: breakdownData,
    isLoading: breakdownLoading,
  } = useFetchBillingCostBreakdown({
    start: dateRange.start,
    end: dateRange.end,
  });

  const exportMutation = useExportBillingCsv();

  const monthEstimate = currentMonthData as Record<string, unknown> | undefined;
  const currentCost = Number(monthEstimate?.current_cost ?? 0);
  const projectedCost = Number(monthEstimate?.projected_cost ?? 0);
  const dailyAverage = Number(monthEstimate?.daily_average ?? 0);
  const breakdown = (monthEstimate?.breakdown ?? {}) as Record<string, number>;

  const costBreakdown = breakdownData as {
    databases?: DatabaseCostItem[];
    by_dimension?: Record<string, DimensionCost>;
    total_cost?: number;
    daily_costs?: Record<string, number>;
  } | undefined;

  const databases = costBreakdown?.databases ?? [];
  const byDimension = costBreakdown?.by_dimension ?? {};
  const maxDimensionCost = Math.max(
    ...Object.values(byDimension).map((d) => d.total_cost),
    0.01
  );

  // Month-over-month change (simple estimate: compare projected vs breakdown total)
  const momChange = projectedCost > 0 && currentCost > 0
    ? ((projectedCost - currentCost * 2) / (currentCost * 2)) * 100
    : 0;

  const isLoading = monthLoading || breakdownLoading;

  const handleExport = () => {
    exportMutation.mutate({
      start: dateRange.start,
      end: dateRange.end,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header + Period Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Billing Overview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Usage costs and projections for your managed databases
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-0.5">
            {(["mtd", "7d", "30d", "90d"] as PeriodPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  period === p
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {p === "mtd" ? "MTD" : p}
              </button>
            ))}
          </div>
          <ModernButton
            variant="outline"
            size="sm"
            onClick={handleExport}
            loading={exportMutation.isPending}
          >
            <Download size={14} className="mr-1" />
            Export CSV
          </ModernButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ModernCard className="p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <DollarSign size={14} />
            <span>Current Month</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(currentCost)}
            </p>
          )}
        </ModernCard>

        <ModernCard className="p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <TrendingUp size={14} />
            <span>Projected</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          ) : (
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(projectedCost)}
            </p>
          )}
        </ModernCard>

        <ModernCard className="p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <BarChart3 size={14} />
            <span>Daily Average</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(dailyAverage)}
            </p>
          )}
        </ModernCard>

        <ModernCard className="p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            {momChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>MoM Change</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          ) : (
            <p className={`text-2xl font-bold ${
              momChange > 0
                ? "text-red-500 dark:text-red-400"
                : momChange < 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-gray-500 dark:text-gray-400"
            }`}>
              {momChange > 0 ? "+" : ""}{momChange.toFixed(1)}%
            </p>
          )}
        </ModernCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Databases by Cost */}
        <ModernCard className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Database size={14} />
            Top Databases by Cost
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : databases.length > 0 ? (
            <div className="space-y-3">
              {databases.slice(0, 8).map((db, idx) => {
                const maxCost = databases[0]?.total_cost || 1;
                const widthPct = Math.max((db.total_cost / maxCost) * 100, 2);

                return (
                  <div key={db.database_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-gray-400 dark:text-gray-500 w-4 text-right">
                          {idx + 1}.
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {db.database_name}
                        </span>
                        {db.engine && (
                          <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase">
                            {db.engine}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-gray-700 dark:text-gray-300 ml-2 shrink-0">
                        {formatCurrency(db.total_cost)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              No database costs for this period.
            </p>
          )}
        </ModernCard>

        {/* Cost Breakdown by Dimension */}
        <ModernCard className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 size={14} />
            Cost by Category
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          ) : Object.keys(byDimension).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(byDimension)
                .filter(([, v]) => v.total_cost > 0)
                .sort(([, a], [, b]) => b.total_cost - a.total_cost)
                .map(([dim, data]) => {
                  const display = DIMENSION_DISPLAY[dim] ?? {
                    label: dim,
                    color: "bg-gray-500",
                    bgColor: "bg-gray-100 dark:bg-gray-800",
                  };
                  const widthPct = Math.max((data.total_cost / maxDimensionCost) * 100, 2);

                  return (
                    <div key={dim} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${display.color}`} />
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {display.label}
                          </span>
                        </div>
                        <span className="font-mono text-gray-700 dark:text-gray-300">
                          {formatCurrency(data.total_cost)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${display.color} transition-all duration-500`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              No cost data for this period.
            </p>
          )}

          {/* Category totals from the month breakdown */}
          {Object.keys(breakdown).length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-2">
              {Object.entries(breakdown)
                .filter(([, v]) => v > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([key, val]) => (
                  <div key={key} className="text-center">
                    <p className="text-[10px] uppercase text-gray-400 dark:text-gray-500">{key}</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(val)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </ModernCard>
      </div>
    </div>
  );
};

export default BillingOverview;
