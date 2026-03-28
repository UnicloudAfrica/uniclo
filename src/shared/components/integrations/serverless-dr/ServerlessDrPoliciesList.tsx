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

/**
 * Return static Tailwind classes for a status.
 * Dynamic class interpolation (bg-${color}-100) doesn't work with Tailwind's purge.
 */
function statusClasses(status: ServerlessDrStatusType): { badge: string; dot: string } {
  switch (status) {
    case "active":
    case "syncing":
    case "completed":
      return {
        badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        dot: "bg-green-500",
      };
    case "dr_live":
    case "failed":
      return {
        badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        dot: "bg-red-500",
      };
    case "failover_started":
    case "booting_dr":
    case "applying_delta":
    case "failback_started":
      return {
        badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        dot: "bg-orange-500",
      };
    case "verifying":
      return {
        badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        dot: "bg-yellow-500",
      };
    default:
      return {
        badge: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
        dot: "bg-gray-500",
      };
  }
}

interface Props {
  context: "admin" | "tenant" | "client";
  detailBasePath: string;
  createPath?: string;
}

export default function ServerlessDrPoliciesList({ context, detailBasePath, createPath }: Props) {
  const navigate = useNavigate();
  const { data: policies = [], isLoading, refetch } = useFetchServerlessDrPolicies();
  const activateMutation = useActivateServerlessDrPolicy();
  const pauseMutation = usePauseServerlessDrPolicy();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="text-center py-16">
        <CloudOff className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          No Serverless DR Policies
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Create a policy to set up cost-effective disaster recovery with DR VMs that stay off until needed.
        </p>
        {createPath && (
          <button
            onClick={() => navigate(createPath)}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Policy
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Policies" value={policies.length} />
        <StatCard label="Active" value={policies.filter((p: ServerlessDrPolicy) => ["active", "syncing"].includes(p.status)).length} variant="green" />
        <StatCard label="DR Live" value={policies.filter((p: ServerlessDrPolicy) => p.status === "dr_live").length} variant="red" />
        <StatCard label="Paused" value={policies.filter((p: ServerlessDrPolicy) => p.status === "paused").length} variant="gray" />
      </div>

      {/* Policy Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Policy</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">VM Mapping</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Sync Interval</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Last Sync</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-950">
            {(policies as ServerlessDrPolicy[]).map((policy) => (
              <tr
                key={policy.identifier}
                className="hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                onClick={() => navigate(`${detailBasePath}/${policy.identifier}`)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{policy.name}</p>
                      <p className="text-xs text-gray-500">{policy.identifier}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses(policy.status).badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusClasses(policy.status).dot}`} />
                    {SDR_STATUS_LABELS[policy.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="font-medium">{policy.source_vm_count}</span>
                  <span className="text-gray-400 mx-1">&rarr;</span>
                  <span className="font-medium">{policy.target_vm_count}</span>
                  <span className="text-gray-400 ml-1">VMs</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  Every {policy.replication_interval_minutes} min
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {policy.last_sync_at
                    ? new Date(policy.last_sync_at).toLocaleString()
                    : "Never"}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {policy.status === "draft" && (
                      <button
                        onClick={() => activateMutation.mutate({ identifier: policy.identifier })}
                        className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600"
                        title="Activate"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    {["active", "syncing"].includes(policy.status) && (
                      <button
                        onClick={() => pauseMutation.mutate({ identifier: policy.identifier })}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                        title="Pause"
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, variant = "default" }: { label: string; value: number; variant?: "default" | "green" | "red" | "gray" }) {
  const colorClass = {
    default: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
    gray: "text-gray-600 dark:text-gray-400",
  }[variant];

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}
