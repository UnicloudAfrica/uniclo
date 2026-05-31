/**
 * useInstanceLiveMetrics — per-instance live telemetry gauges.
 *
 * Shared by the tenant and client monitoring pages. Resolves the caller's
 * audience prefix via `useApiContext` + `apiRegistry`, so a single hook
 * serves both:
 *
 *   Tenant: GET /tenant/v1/admin/monitoring/hosts/{instanceId}/metrics
 *   Client: GET /api/v1/business/monitoring/hosts/{instanceId}/metrics
 *
 * Producer: backend `MonitoringHostMetricsController` (scoped to the caller).
 * Contract — fields live at the TOP LEVEL of the envelope, NOT under `data`:
 *
 *   { success: true,
 *     metrics: { cpu_percent, memory_percent, disk_percent,
 *                network_in_mbps, network_out_mbps, collected_at } | null,
 *     source: "cuberwatch" | "none",
 *     message?: string }
 *
 * `metrics` is null when the instance isn't a CuberWatch host or has no real
 * data yet; individual fields inside may be null when CuberWatch didn't
 * report them. NEVER fabricate — callers render "—" for nulls.
 */
import { useQuery } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";

export interface InstanceLiveMetrics {
  cpu_percent: number | null;
  memory_percent: number | null;
  disk_percent: number | null;
  network_in_mbps: number | null;
  network_out_mbps: number | null;
  collected_at: string | null;
}

export interface InstanceLiveMetricsResult {
  metrics: InstanceLiveMetrics | null;
  source: string;
}

interface LiveMetricsEnvelope {
  success?: boolean;
  metrics?: InstanceLiveMetrics | null;
  source?: string;
  message?: string;
}

/**
 * Fetch live CPU / memory / disk / network for a single monitored instance.
 *
 * Refetches every 30s to stay live-ish (matches the monitoring cadence).
 * The query key is intentionally stable — `['instance-live-metrics',
 * instanceId]` — to avoid the infinite-refetch storm a `new Date()`-derived
 * key caused earlier in this project.
 */
export const useInstanceLiveMetrics = (
  instanceId: string | number | null | undefined
): InstanceLiveMetricsResult => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const id = instanceId == null ? "" : String(instanceId);

  const query = useQuery<InstanceLiveMetricsResult>({
    queryKey: ["instance-live-metrics", id],
    queryFn: async () => {
      const res = (await entry.silentApi.get<LiveMetricsEnvelope>(
        `${entry.urlPrefix}/monitoring/hosts/${id}/metrics`
      )) as LiveMetricsEnvelope | null;

      // Fields sit at the top level of the envelope (not under `data`).
      const metrics = res?.metrics ?? null;
      return {
        metrics,
        source: res?.source ?? "none",
      };
    },
    enabled: id !== "",
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return query.data ?? { metrics: null, source: "none" };
};
