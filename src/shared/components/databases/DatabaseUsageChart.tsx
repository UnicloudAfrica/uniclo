/**
 * DatabaseUsageChart -- Time-series chart showing cost over time for a single database.
 *
 * Displays daily cost bars with dimension breakdown (stacked),
 * a period selector (7d / 30d / 90d / custom), and current month
 * total plus projected total. CSS-only bar charts with Tailwind.
 */
import React, { useState, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  DollarSign,
  Loader2,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import {
  useFetchDatabaseUsage,
  useFetchDatabaseCostEstimate,
} from "@/shared/hooks/resources/managedDatabaseHooks";

// ── Types ────────────────────────────────────────────────────────

type Identifier = string | number;

interface DailyCost {
  date: string;
  compute: number;
  storage: number;
  io: number;
  transfer: number;
  backup: number;
  replica: number;
  total: number;
}

type PeriodPreset = "7d" | "30d" | "90d";

// ── Dimension Colors ─────────────────────────────────────────────

const DIMENSION_COLORS: Record<string, { bar: string; label: string }> = {
  compute: { bar: "bg-blue-500", label: "Compute" },
  storage: { bar: "bg-emerald-500", label: "Storage" },
  io: { bar: "bg-amber-500", label: "I/O" },
  transfer: { bar: "bg-purple-500", label: "Transfer" },
  backup: { bar: "bg-cyan-500", label: "Backup" },
  replica: { bar: "bg-rose-500", label: "Replica" },
};

const DIMENSION_TO_CATEGORY: Record<string, keyof typeof DIMENSION_COLORS> = {
  compute_hours: "compute",
  storage_gb_hours: "storage",
  iops_read: "io",
  iops_write: "io",
  data_transfer_in_gb: "transfer",
  data_transfer_out_gb: "transfer",
  backup_storage_gb_hours: "backup",
  replica_compute_hours: "replica",
};

// ── Helpers ──────────────────────────────────────────────────────

const formatCurrency = (val: number): string => {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  if (val >= 1) return `$${val.toFixed(2)}`;
  if (val > 0) return `$${val.toFixed(4)}`;
  return "$0.00";
};

const getDateRange = (preset: PeriodPreset): { start: string; end: string } => {
  const end = new Date();
  const start = new Date();
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  start.setDate(start.getDate() - days);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
};

// ── Aggregate usage records into daily cost buckets ──────────────

function aggregateUsageRecords(
  records: Array<{
    period_start: string;
    dimension: string;
    total_cost: number;
  }>
): DailyCost[] {
  const dayMap = new Map<string, DailyCost>();

  for (const r of records) {
    const date = r.period_start.split("T")[0];
    const category = DIMENSION_TO_CATEGORY[r.dimension] ?? "compute";
    const cost = Number(r.total_cost) || 0;

    if (!dayMap.has(date)) {
      dayMap.set(date, {
        date,
        compute: 0,
        storage: 0,
        io: 0,
        transfer: 0,
        backup: 0,
        replica: 0,
        total: 0,
      });
    }

    const day = dayMap.get(date)!;
    (day as unknown as Record<string, number>)[category] += cost;
    day.total += cost;
  }

  return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// ── Component ────────────────────────────────────────────────────

interface DatabaseUsageChartProps {
  identifier: Identifier;
}

const DatabaseUsageChart: React.FC<DatabaseUsageChartProps> = ({ identifier }) => {
  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const dateRange = useMemo(() => getDateRange(period), [period]);

  const {
    data: usageData,
    isLoading: usageLoading,
  } = useFetchDatabaseUsage(identifier, {
    start: dateRange.start,
    end: dateRange.end,
  });

  const {
    data: costEstimate,
    isLoading: estimateLoading,
  } = useFetchDatabaseCostEstimate(identifier);

  const dailyCosts = useMemo(() => {
    const records = Array.isArray(usageData) ? usageData : [];
    return aggregateUsageRecords(records);
  }, [usageData]);

  const maxDayCost = useMemo(
    () => Math.max(...dailyCosts.map((d) => d.total), 0.01),
    [dailyCosts]
  );

  const totalCost = useMemo(
    () => dailyCosts.reduce((sum, d) => sum + d.total, 0),
    [dailyCosts]
  );

  const isLoading = usageLoading || estimateLoading;

  // ── Loading State ──
  if (isLoading && dailyCosts.length === 0) {
    return (
      <ModernCard className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading usage data...</span>
        </div>
      </ModernCard>
    );
  }

  const estimate = costEstimate as Record<string, unknown> | undefined;
  const projectedCost = Number(estimate?.projected_monthly_cost ?? 0);

  return (
    <ModernCard className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Usage & Cost
          </h3>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-0.5">
          {(["7d", "30d", "90d"] as PeriodPreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <DollarSign size={12} />
            <span>Period Total</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(totalCost)}
          </p>
        </div>

        <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Calendar size={12} />
            <span>MTD</span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(Number(estimate?.total_cost ?? totalCost))}
          </p>
        </div>

        <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp size={12} />
            <span>Projected</span>
          </div>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(projectedCost)}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      {dailyCosts.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-end gap-px" style={{ height: "160px" }}>
            {dailyCosts.map((day) => {
              const heightPct = (day.total / maxDayCost) * 100;
              const segments = (["compute", "storage", "io", "transfer", "backup", "replica"] as const)
                .filter((k) => day[k] > 0)
                .map((k) => ({
                  key: k,
                  pct: (day[k] / day.total) * heightPct,
                  color: DIMENSION_COLORS[k].bar,
                }));

              return (
                <div
                  key={day.date}
                  className="group relative flex-1 flex flex-col justify-end"
                  style={{ height: "100%" }}
                >
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="rounded-lg bg-gray-900 dark:bg-gray-700 px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap">
                      <p className="font-medium mb-1">{day.date}</p>
                      <p className="text-emerald-300">{formatCurrency(day.total)}</p>
                    </div>
                  </div>

                  {/* Stacked bar */}
                  <div className="flex flex-col justify-end w-full" style={{ height: `${heightPct}%` }}>
                    {segments.map((seg) => (
                      <div
                        key={seg.key}
                        className={`w-full ${seg.color} first:rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity`}
                        style={{ height: `${(seg.pct / heightPct) * 100}%`, minHeight: seg.pct > 0 ? "1px" : 0 }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-px text-[10px] text-gray-400 dark:text-gray-500">
            {dailyCosts.length > 0 && (
              <>
                <span className="flex-1 text-left truncate">{dailyCosts[0].date.slice(5)}</span>
                {dailyCosts.length > 2 && (
                  <span className="flex-1 text-center truncate">
                    {dailyCosts[Math.floor(dailyCosts.length / 2)].date.slice(5)}
                  </span>
                )}
                <span className="flex-1 text-right truncate">
                  {dailyCosts[dailyCosts.length - 1].date.slice(5)}
                </span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          No usage data for the selected period.
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        {Object.entries(DIMENSION_COLORS).map(([key, { bar, label }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${bar}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </ModernCard>
  );
};

export default DatabaseUsageChart;
