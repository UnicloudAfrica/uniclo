/**
 * Admin Tenant Monitoring hooks (Stream A, task A3).
 *
 * Pairs with the backend `TenantMonitoringController` mounted under
 *   `/admin/v1/tenants/{tenantId}/monitoring/*`
 * (the admin baseURL `${API_BASE_URL}/admin/v1` is auto-prepended by the
 * shared `silentApi` client, so call sites pass paths relative to it).
 *
 * Exposes:
 *  - useTenantInstances(tenantId)
 *  - useInstanceMetrics(tenantId, instanceId, params)
 *  - useInstanceDisk(tenantId, instanceId)
 *  - useGenerateUtilizationReport(tenantId)
 *
 * The "Generate Report" mutation receives a binary stream
 * (`Content-Disposition: attachment`) — we hand-roll fetch() for that
 * one path because both the shared JSON client and the `fileApi` GET
 * helper would mis-decode the response.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import config from "../../config";
import useAuthStore from "../../stores/authStore";

// ─── Types ────────────────────────────────────────────────────────────

export type MetricKind = "cpu" | "memory" | "network";
export type MetricStatistic = "mean" | "max" | "min";
export type ReportOutput = "pdf" | "csv";

export interface TenantMonitoringInstance {
  id: string;
  identifier: string;
  name: string;
  status: string;
  public_ip?: string | null;
  region?: string | null;
  availability_zone?: string | null;
}

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface MetricSummary {
  mean: number | null;
  peak: number | null;
  count: number;
  unit: string;
}

export interface InstanceMetricsResponse {
  metric: MetricKind;
  interval_minutes: number;
  statistic: MetricStatistic;
  points: MetricPoint[];
  summary: MetricSummary;
}

export interface InstanceDiskRecord {
  volume_identifier: string;
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
  recorded_at: string;
  // Present when the source is a percent-only series (CuberWatch/Prometheus
  // node_filesystem ratio) that carries no absolute byte capacity. The BE
  // sends this so the gauge can render a real % without fabricated bytes.
  disk_percent?: number;
}

export interface InstanceMetricsParams {
  metric: MetricKind;
  start: string;
  end: string;
  statistic?: MetricStatistic;
  interval?: number;
}

export interface GenerateReportPayload {
  start: string;
  end: string;
  output: ReportOutput;
}

// ─── Query key factories ──────────────────────────────────────────────

export const tenantMonitoringKeys = {
  all: (tenantId: string) => ["admin", "tenant-monitoring", tenantId] as const,
  instances: (tenantId: string) =>
    [...tenantMonitoringKeys.all(tenantId), "instances"] as const,
  metrics: (tenantId: string, instanceId: string, params: InstanceMetricsParams) =>
    [
      ...tenantMonitoringKeys.all(tenantId),
      "metrics",
      instanceId,
      params.metric,
      params.start,
      params.end,
      params.statistic ?? "mean",
      params.interval ?? 5,
    ] as const,
  disk: (tenantId: string, instanceId: string) =>
    [...tenantMonitoringKeys.all(tenantId), "disk", instanceId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────

/**
 * List a tenant's active instances eligible for monitoring.
 * Written by the backend `TenantMonitoringController@instances`.
 */
export function useTenantInstances(tenantId: string | undefined) {
  return useQuery<TenantMonitoringInstance[]>({
    queryKey: tenantId ? tenantMonitoringKeys.instances(tenantId) : ["admin", "tenant-monitoring", "pending"],
    queryFn: async () => {
      const r = await silentApi<{ data: TenantMonitoringInstance[] }>(
        "GET",
        `/tenants/${tenantId}/monitoring/instances`
      );
      return r?.data ?? [];
    },
    enabled: !!tenantId,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Fetch a single metric series for an instance.
 * Written by the backend `TenantMonitoringController@metrics`, which
 * unwraps `App\Services\InstanceManagementService::getInstanceMetrics()`
 * into the contract above.
 */
export function useInstanceMetrics(
  tenantId: string | undefined,
  instanceId: string | undefined,
  params: InstanceMetricsParams
) {
  const enabled = !!tenantId && !!instanceId && !!params.start && !!params.end;

  return useQuery<InstanceMetricsResponse>({
    queryKey: tenantId && instanceId
      ? tenantMonitoringKeys.metrics(tenantId, instanceId, params)
      : ["admin", "tenant-monitoring", "metrics-pending"],
    queryFn: async () => {
      const query = new URLSearchParams({
        metric: params.metric,
        start: params.start,
        end: params.end,
        statistic: params.statistic ?? "mean",
        interval: String(params.interval ?? 5),
      });
      const r = await silentApi<{ data: InstanceMetricsResponse }>(
        "GET",
        `/tenants/${tenantId}/monitoring/instances/${instanceId}/metrics?${query.toString()}`
      );
      return r.data;
    },
    enabled,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Fetch the latest disk snapshot rows for an instance.
 * Phase-1 backend may legitimately return an empty array until the disk
 * collector is wired — render a neutral placeholder rather than an error.
 */
export function useInstanceDisk(
  tenantId: string | undefined,
  instanceId: string | undefined
) {
  return useQuery<InstanceDiskRecord[]>({
    queryKey: tenantId && instanceId
      ? tenantMonitoringKeys.disk(tenantId, instanceId)
      : ["admin", "tenant-monitoring", "disk-pending"],
    queryFn: async () => {
      const r = await silentApi<{ data: InstanceDiskRecord[] }>(
        "GET",
        `/tenants/${tenantId}/monitoring/instances/${instanceId}/disk`
      );
      return r?.data ?? [];
    },
    enabled: !!tenantId && !!instanceId,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// ─── Report download ─────────────────────────────────────────────────

/**
 * Read the filename suggested by `Content-Disposition: attachment;
 * filename="utilization-{tenant}-{date}.{ext}"`. Falls back to a
 * deterministic name when the header is missing.
 */
const filenameFromHeader = (
  headerValue: string | null,
  fallback: string
): string => {
  if (!headerValue) return fallback;
  // Support both `filename="x.pdf"` and bare `filename=x.pdf`.
  const quoted = headerValue.match(/filename\*?="?([^";]+)"?/i);
  return quoted?.[1]?.trim() || fallback;
};

const triggerBrowserDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/**
 * Submit a utilization report request and stream the response to disk.
 *
 * Hand-rolled fetch (rather than `silentApi`) because the shared client
 * insists on JSON parsing, which would reject the binary PDF/CSV body.
 */
export function useGenerateUtilizationReport(tenantId: string | undefined) {
  return useMutation<{ filename: string; output: ReportOutput }, Error, GenerateReportPayload>({
    mutationFn: async (payload) => {
      if (!tenantId) {
        throw new Error("Missing tenant id.");
      }

      const url = `${config.adminURL}/tenants/${tenantId}/monitoring/reports`;
      const headers = useAuthStore.getState().getAuthHeaders();

      const response = await fetch(url, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to lift a server-side error message; fall back to status text.
        let message = `Report request failed (${response.status}).`;
        try {
          const body = await response.json();
          if (body && typeof body === "object") {
            const m = (body as Record<string, unknown>).message;
            const e = (body as Record<string, unknown>).error;
            if (typeof m === "string") message = m;
            else if (typeof e === "string") message = e;
          }
        } catch {
          /* swallow — body wasn't JSON */
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const ext = payload.output === "csv" ? "csv" : "pdf";
      const fallback = `utilization-${tenantId}-${payload.end.slice(0, 10)}.${ext}`;
      const filename = filenameFromHeader(
        response.headers.get("Content-Disposition"),
        fallback
      );

      triggerBrowserDownload(blob, filename);

      return { filename, output: payload.output };
    },
  });
}

// Test-only helper exports — keep internal logic verifiable without
// having to spin up `fetch` mocks for every assertion.
export const __testables = {
  filenameFromHeader,
};
