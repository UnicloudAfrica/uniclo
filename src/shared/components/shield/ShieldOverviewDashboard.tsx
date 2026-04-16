/**
 * ShieldOverviewDashboard — Admin overview of Shield platform usage.
 */
import React from "react";
import { Globe, Shield, ShieldCheck, Zap } from "lucide-react";
import {
  useFetchShieldOverview,
  useFetchShieldProviders,
} from "@/shared/hooks/resources/shieldHooks";
import type { ShieldOverview, ShieldProviderInfo } from "@/shared/hooks/resources/shieldHooks";

interface ShieldOverviewDashboardProps {
  context: "admin" | "tenant" | "client";
}

const ShieldOverviewDashboard: React.FC<ShieldOverviewDashboardProps> = () => {
  const { data: rawOverview, isLoading: overviewLoading } = useFetchShieldOverview();
  const { data: providers = [], isLoading: providersLoading } = useFetchShieldProviders();

  const overview = rawOverview as ShieldOverview | undefined;
  const providerList = providers as ShieldProviderInfo[];

  if (overviewLoading || providersLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--theme-color)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="db-surface-card rounded-2xl border px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
            <Globe size={14} /> Total Domains
          </div>
          <div className="mt-2 text-3xl font-semibold text-[var(--theme-heading-color)]">
            {overview?.total_domains ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
            <ShieldCheck size={14} /> Active
          </div>
          <div className="mt-2 text-3xl font-semibold text-emerald-950">
            {overview?.active_domains ?? 0}
          </div>
        </div>
        {Object.entries(overview?.by_provider ?? {}).map(([provider, count]) => (
          <div key={provider} className="db-surface-card rounded-2xl border px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
              <Shield size={14} /> {`Provider ${provider === "stormwall" ? "A" : "B"}`}
            </div>
            <div className="mt-2 text-3xl font-semibold text-[var(--theme-heading-color)]">
              {count}
            </div>
          </div>
        ))}
      </div>

      {/* Provider Status */}
      <div className="db-surface-card rounded-2xl border p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
          Provider Status
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {providerList.map((p) => (
            <div
              key={p.key}
              className={`rounded-xl border p-4 ${
                p.configured
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-red-200 bg-red-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--theme-heading-color)]">
                  {p.key === "stormwall" ? "Provider A" : "Provider B"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.configured
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {p.configured ? "Connected" : "Not Configured"}
                </span>
              </div>
              <div className="mt-2 text-sm text-[var(--theme-muted-color)]">
                {p.domain_count} domain{p.domain_count !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Breakdown */}
      {overview?.by_status && Object.keys(overview.by_status).length > 0 && (
        <div className="db-surface-card rounded-2xl border p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
            Status Breakdown
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(overview.by_status).map(([status, count]) => (
              <div key={status} className="rounded-xl bg-[var(--theme-color-10)] px-4 py-2">
                <span className="text-sm capitalize text-[var(--theme-heading-color)]">
                  {status.replace("_", " ")}
                </span>
                <span className="ml-2 font-semibold text-[var(--theme-color)]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShieldOverviewDashboard;
