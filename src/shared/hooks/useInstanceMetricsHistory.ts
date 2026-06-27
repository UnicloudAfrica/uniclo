/**
 * useInstanceMetricsHistory — historical CPU/memory/disk % time-series for a
 * monitored instance.
 *
 * The "shop-fetches-it" path: unicloud's backend pulls the range from CuberWatch
 * via the single partner credential (scoped to the caller's own instance) and
 * returns it — the customer never authenticates to CuberWatch.
 *
 *   GET {prefix}/monitoring/hosts/{instanceId}/metrics/history?range=6h
 *
 * Producer: `MonitoringSubscriptionController::instanceMetricsHistory`. Fields
 * live at the TOP LEVEL of the envelope (not under `data`), mirroring
 * `useInstanceLiveMetrics`:
 *
 *   { metrics: { cpu_percent: [{timestamp,value}], memory_percent, disk_percent }
 *              | null,
 *     source: "cuberwatch" | "none" }
 *
 * `metrics` is null when the instance isn't reporting real data yet — callers
 * render an honest empty state, never fabricated points.
 */
import { useQuery } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";

export type MetricPoint = { timestamp: string; value: number };
export type HistoryRange = "1h" | "6h" | "24h" | "7d";

export interface InstanceMetricsHistory {
  cpu_percent: MetricPoint[];
  memory_percent: MetricPoint[];
  disk_percent: MetricPoint[];
}

interface HistoryEnvelope {
  metrics?: InstanceMetricsHistory | null;
  source?: string;
}

export interface InstanceMetricsHistoryResult {
  metrics: InstanceMetricsHistory | null;
  source: string;
  isLoading: boolean;
}

export const useInstanceMetricsHistory = (
  instanceId: string | number | null | undefined,
  range: HistoryRange,
): InstanceMetricsHistoryResult => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const id = instanceId == null ? "" : String(instanceId);

  const query = useQuery<{
    metrics: InstanceMetricsHistory | null;
    source: string;
  }>({
    queryKey: ["instance-metrics-history", id, range],
    queryFn: async () => {
      const res = (await entry.silentApi.get<HistoryEnvelope>(
        `${entry.urlPrefix}/monitoring/hosts/${id}/metrics/history?range=${range}`,
      )) as HistoryEnvelope | null;

      // Fields sit at the top level of the envelope (not under `data`).
      return { metrics: res?.metrics ?? null, source: res?.source ?? "none" };
    },
    enabled: id !== "",
    refetchOnWindowFocus: false,
    retry: false,
  });

  return {
    metrics: query.data?.metrics ?? null,
    source: query.data?.source ?? "none",
    isLoading: query.isLoading,
  };
};
