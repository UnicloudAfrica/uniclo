import React, { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { ModernCard } from "@/shared/components/ui";

import type { InstanceUsageStats } from "./instanceDetailsTypes";
import { formatPercentage, USAGE_PERIOD_OPTIONS } from "./instanceDetailsUtils";

interface InstanceTelemetryCardProps {
  telemetrySummary: Array<{ label: string; value: string }>;
  usagePeriod: string;
  setUsagePeriod: (period: string) => void;
  isUsageLoading: boolean;
  usageStats: InstanceUsageStats | null;
}

const InstanceTelemetryCard: React.FC<InstanceTelemetryCardProps> = ({
  telemetrySummary,
  usagePeriod,
  setUsagePeriod,
  isUsageLoading,
  usageStats,
}) => {
  const usageContent = useMemo(() => {
    if (isUsageLoading) {
      return (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-slate-500">Loading usage metrics...</span>
        </div>
      );
    }
    const stats = usageStats;
    if (stats) {
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "CPU Average",
              value: stats.cpu_average ? formatPercentage(stats.cpu_average) : "N/A",
            },
            {
              label: "Memory Average",
              value: stats.memory_average ? `${stats.memory_average} MB` : "N/A",
            },
            {
              label: "Network In",
              value: stats.network_in ? `${stats.network_in} MB` : "N/A",
            },
            {
              label: "Network Out",
              value: stats.network_out ? `${stats.network_out} MB` : "N/A",
            },
            {
              label: "Disk Read",
              value: stats.disk_read ? `${stats.disk_read} MB` : "N/A",
            },
            {
              label: "Disk Write",
              value: stats.disk_write ? `${stats.disk_write} MB` : "N/A",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      );
    }
    return (
      <p className="text-sm text-slate-500">
        Usage metrics are not available for this instance yet.
      </p>
    );
  }, [isUsageLoading, usageStats]);

  return (
    <ModernCard padding="xl" className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Usage &amp; Telemetry</h2>
          <p className="text-sm text-slate-500">
            Aggregated resource consumption as reported by the provider.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600" htmlFor="usage-period">
            Period
          </label>
          <select
            id="usage-period"
            value={usagePeriod}
            onChange={(event) => setUsagePeriod(event.target.value as string)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {USAGE_PERIOD_OPTIONS.map((option: { value: string; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {telemetrySummary.map((metric: { label: string; value: string }) => (
          <div
            key={metric.label}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {metric.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>

      {usageContent}
      {usageStats?.period ? (
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Reporting window: {String(usageStats.period)}
        </p>
      ) : null}
    </ModernCard>
  );
};

export default InstanceTelemetryCard;
