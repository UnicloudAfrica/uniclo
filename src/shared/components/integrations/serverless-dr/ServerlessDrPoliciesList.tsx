import React from "react";
import { useNavigate } from "react-router-dom";
import {
  useFetchServerlessDrPolicies,
  useActivateServerlessDrPolicy,
  usePauseServerlessDrPolicy,
} from "@/shared/hooks/resources/serverlessDrHooks";
import { SDR_STATUS_LABELS } from "@/types/serverlessDr";
import type { ServerlessDrPolicy, ServerlessDrStatusType } from "@/types/serverlessDr";
import { Shield, Play, Pause, ChevronRight, CloudOff, RefreshCw } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Return static Tailwind classes for a status.
 * Dynamic class interpolation (bg-${color}-100) doesn't work with Tailwind's purge.
 */
function statusClasses(status: ServerlessDrStatusType): {
  badge: string;
  dot: string;
  leftBar: string;
} {
  switch (status) {
    case "active":
    case "syncing":
    case "completed":
      return {
        badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        dot: "bg-green-500",
        leftBar: "bg-green-500",
      };
    case "dr_live":
    case "failed":
      return {
        badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        dot: "bg-red-500",
        leftBar: "bg-red-500",
      };
    case "failover_started":
    case "booting_dr":
    case "applying_delta":
    case "failback_started":
      return {
        badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        dot: "bg-orange-500",
        leftBar: "bg-orange-500",
      };
    case "verifying":
      return {
        badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        dot: "bg-yellow-500",
        leftBar: "bg-yellow-500",
      };
    default:
      return {
        badge: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
        dot: "bg-gray-400",
        leftBar: "bg-gray-400",
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  context: "admin" | "tenant" | "client";
  detailBasePath: string;
  createPath?: string;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ServerlessDrPoliciesList({ _context, detailBasePath, createPath }: Props) {
  const navigate = useNavigate();
  const { data: policies = [], isLoading, _refetch } = useFetchServerlessDrPolicies();
  const activateMutation = useActivateServerlessDrPolicy();
  const pauseMutation = usePauseServerlessDrPolicy();

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border p-5 animate-pulse"
              style={{
                backgroundColor: "var(--theme-card-bg, #fff)",
                borderColor: "var(--theme-border-color, #e5e7eb)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-12 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton table */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: "var(--theme-card-bg, #fff)",
            borderColor: "var(--theme-border-color, #e5e7eb)",
          }}
        >
          <div className="px-5 py-4" style={{ backgroundColor: "var(--theme-surface-alt, #f9fafb)" }}>
            <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="px-5 py-4 border-t animate-pulse"
              style={{ borderColor: "var(--theme-border-color, #e5e7eb)" }}
            >
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-800 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- Empty state ---- */
  if (policies.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 px-6 rounded-xl border"
        style={{
          backgroundColor: "var(--theme-card-bg, #fff)",
          borderColor: "var(--theme-border-color, #e5e7eb)",
        }}
      >
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
            <CloudOff className="h-9 w-9 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
            <Shield className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <h3
          className="text-lg font-semibold"
          style={{ color: "var(--theme-heading-color, #111827)" }}
        >
          No Serverless DR Policies
        </h3>
        <p
          className="mt-2 text-sm text-center max-w-sm leading-relaxed"
          style={{ color: "var(--theme-muted-color, #6b7280)" }}
        >
          Create a policy to set up cost-effective disaster recovery with DR VMs that stay off until
          needed.
        </p>
        {createPath && (
          <button
            onClick={() => navigate(createPath)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            <Shield className="h-4 w-4" />
            Create Policy
          </button>
        )}
      </div>
    );
  }

  /* ---- Derived counts ---- */
  const activeCount = policies.filter((p: ServerlessDrPolicy) =>
    ["active", "syncing"].includes(p.status)
  ).length;
  const drLiveCount = policies.filter(
    (p: ServerlessDrPolicy) => p.status === "dr_live"
  ).length;
  const pausedCount = policies.filter(
    (p: ServerlessDrPolicy) => p.status === "paused"
  ).length;

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/*  Hero Stats Row                                                   */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <HeroStatCard
          icon={<Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          value={policies.length}
          label="Total Policies"
          valueColor="text-blue-600 dark:text-blue-400"
        />
        <HeroStatCard
          icon={<Play className="w-5 h-5 text-green-600 dark:text-green-400" />}
          iconBg="bg-green-100 dark:bg-green-900/30"
          value={activeCount}
          label="Active"
          valueColor="text-green-600 dark:text-green-400"
        />
        <HeroStatCard
          icon={<RefreshCw className="w-5 h-5 text-red-600 dark:text-red-400" />}
          iconBg="bg-red-100 dark:bg-red-900/30"
          value={drLiveCount}
          label="DR Live"
          valueColor="text-red-600 dark:text-red-400"
        />
        <HeroStatCard
          icon={<Pause className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
          iconBg="bg-gray-100 dark:bg-gray-800/50"
          value={pausedCount}
          label="Paused"
          valueColor="text-gray-600 dark:text-gray-400"
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*  Policy Table                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: "var(--theme-card-bg, #fff)",
          borderColor: "var(--theme-border-color, #e5e7eb)",
        }}
      >
        <table className="min-w-full">
          <thead>
            <tr style={{ backgroundColor: "var(--theme-surface-alt, #f9fafb)" }}>
              <th
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--theme-muted-color, #6b7280)" }}
              >
                Policy
              </th>
              <th
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--theme-muted-color, #6b7280)" }}
              >
                Status
              </th>
              <th
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--theme-muted-color, #6b7280)" }}
              >
                VM Mapping
              </th>
              <th
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell"
                style={{ color: "var(--theme-muted-color, #6b7280)" }}
              >
                Sync Interval
              </th>
              <th
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell"
                style={{ color: "var(--theme-muted-color, #6b7280)" }}
              >
                Last Sync
              </th>
              <th
                className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--theme-muted-color, #6b7280)" }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--theme-border-color, #f3f4f6)" }}>
            {(policies as ServerlessDrPolicy[]).map((policy) => {
              const classes = statusClasses(policy.status);
              return (
                <tr
                  key={policy.identifier}
                  className="group cursor-pointer transition-colors duration-150 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                  onClick={() => navigate(`${detailBasePath}/${policy.identifier}`)}
                >
                  {/* Left color indicator + Policy name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-10 rounded-full ${classes.leftBar} shrink-0`} />
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                        <Shield className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: "var(--theme-heading-color, #111827)" }}
                        >
                          {policy.name}
                        </p>
                        <p
                          className="text-xs truncate mt-0.5"
                          style={{ color: "var(--theme-muted-color, #6b7280)" }}
                        >
                          {policy.identifier}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Status badge */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${classes.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${classes.dot}`} />
                      {SDR_STATUS_LABELS[policy.status]}
                    </span>
                  </td>

                  {/* VM Mapping */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span
                        className="font-semibold"
                        style={{ color: "var(--theme-heading-color, #111827)" }}
                      >
                        {policy.source_vm_count}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--theme-muted-color, #9ca3af)" }}
                      >
                        &rarr;
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--theme-heading-color, #111827)" }}
                      >
                        {policy.target_vm_count}
                      </span>
                      <span
                        className="text-xs ml-0.5"
                        style={{ color: "var(--theme-muted-color, #9ca3af)" }}
                      >
                        VMs
                      </span>
                    </div>
                  </td>

                  {/* Sync Interval */}
                  <td
                    className="px-5 py-4 text-sm hidden md:table-cell"
                    style={{ color: "var(--theme-text-color, #374151)" }}
                  >
                    Every {policy.replication_interval_minutes} min
                  </td>

                  {/* Last Sync */}
                  <td
                    className="px-5 py-4 text-sm hidden lg:table-cell"
                    style={{ color: "var(--theme-muted-color, #6b7280)" }}
                  >
                    {policy.last_sync_at
                      ? new Date(policy.last_sync_at).toLocaleString()
                      : "Never"}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {policy.status === "draft" && (
                        <button
                          onClick={() =>
                            activateMutation.mutate({ identifier: policy.identifier })
                          }
                          className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors duration-150"
                          title="Activate"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {["active", "syncing"].includes(policy.status) && (
                        <button
                          onClick={() =>
                            pauseMutation.mutate({ identifier: policy.identifier })
                          }
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors duration-150"
                          title="Pause"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors duration-150" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero Stat Card                                                     */
/* ------------------------------------------------------------------ */

function HeroStatCard({
  icon,
  iconBg,
  value,
  label,
  valueColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
  valueColor: string;
}) {
  return (
    <div
      className="rounded-xl border p-5 transition-shadow duration-200 hover:shadow-md"
      style={{
        backgroundColor: "var(--theme-card-bg, #fff)",
        borderColor: "var(--theme-border-color, #e5e7eb)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
          <div
            className="text-sm font-medium"
            style={{ color: "var(--theme-muted-color, #6b7280)" }}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
