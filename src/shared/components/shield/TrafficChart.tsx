/**
 * TrafficChart — Traffic stats display for a Shield domain.
 */
import React from "react";
import { BarChart3, Globe, RefreshCw, Shield, Zap } from "lucide-react";
import { useFetchTrafficStats } from "@/shared/hooks/resources/shieldHooks";
import type { ShieldTrafficStats } from "@/shared/hooks/resources/shieldHooks";

interface TrafficChartProps {
  domainId: string;
}

const formatNumber = (n: number | undefined): string => {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

const formatBytes = (bytes: number | undefined): string => {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  return `${(bytes / 1_024).toFixed(2)} KB`;
};

const TrafficChart: React.FC<TrafficChartProps> = ({ domainId }) => {
  const { data: rawStats, isLoading, isError, error, refetch } = useFetchTrafficStats(domainId, {
    refetchInterval: 30_000,
  });

  const stats = rawStats as ShieldTrafficStats | undefined;

  if (isError) {
    return (
      <div className="db-surface-card flex flex-col items-center justify-center gap-3 rounded-2xl border p-8 text-center">
        <p className="text-sm text-red-600">
          {error?.message || "Failed to load traffic stats."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--theme-color)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="db-surface-card rounded-2xl border p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
        Traffic Overview
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-[var(--theme-color-10)] p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--theme-muted-color)]">
            <Globe size={14} /> Total Requests
          </div>
          <div className="mt-2 text-2xl font-semibold text-[var(--theme-heading-color)]">
            {formatNumber(stats?.requests_total)}
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <BarChart3 size={14} /> Cached
          </div>
          <div className="mt-2 text-2xl font-semibold text-emerald-950">
            {formatNumber(stats?.requests_cached)}
          </div>
        </div>
        <div className="rounded-xl bg-sky-50 p-4">
          <div className="flex items-center gap-2 text-xs text-sky-700">
            <Zap size={14} /> Bandwidth
          </div>
          <div className="mt-2 text-2xl font-semibold text-sky-950">
            {formatBytes(stats?.bandwidth_total)}
          </div>
        </div>
        <div className="rounded-xl bg-red-50 p-4">
          <div className="flex items-center gap-2 text-xs text-red-700">
            <Shield size={14} /> Threats Blocked
          </div>
          <div className="mt-2 text-2xl font-semibold text-red-950">
            {formatNumber(stats?.threats_blocked)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficChart;
