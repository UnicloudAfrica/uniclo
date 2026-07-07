import {
  Play,
  Square,
  RotateCw,
  Pause,
  Moon,
  Camera,
  Maximize,
  RefreshCw,
  Trash2,
} from "lucide-react";

import type {
  ActionConfig,
  ActionTone,
  DisplayInstance,
  GenericRecord,
  InstanceTelemetry,
  LifecycleData,
  LifecycleDataSource,
} from "./instanceDetailsTypes";
import { isProvisioning } from "@/shared/components/instances/instanceStatus";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const USAGE_PERIOD_OPTIONS = [
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

export const LOG_LINE_OPTIONS = [50, 100, 200, 500];
export const PROVISIONING_POLL_INTERVAL_MS = 5000;
// 24 × 5s = a 2-minute budget. A stop that settles to `suspended` only after
// the provider reports `stopping` needs more than the previous 30s window.
export const PROVISIONING_POLL_MAX_ATTEMPTS = 24;

// ---------------------------------------------------------------------------
// Provisioning poll helpers
// ---------------------------------------------------------------------------

/**
 * React Query `refetchInterval` decision for the instance-management query.
 *
 * Passive self-heal: while the instance sits in a transitional status the page
 * quietly re-fetches every {@link PROVISIONING_POLL_INTERVAL_MS} so the
 * HeroBanner buttons re-enable on their own once the provider settles — even
 * when the action-driven poll gave up or was never started. Returns `false`
 * (no polling) for any settled status or a missing / non-object payload.
 *
 * Reads the same path the page renders: `data.instance.status`.
 */
export const managementRefetchInterval = (data: unknown): number | false => {
  if (!data || typeof data !== "object") return false;
  const instance = (data as Record<string, unknown>)["instance"];
  if (!instance || typeof instance !== "object") return false;
  const status = (instance as Record<string, unknown>)["status"];
  return isProvisioning(status) ? PROVISIONING_POLL_INTERVAL_MS : false;
};

/** Stop-like actions whose settled target is a halted VM, not a running one. */
const STOP_LIKE_ACTIONS = new Set(["stop", "force_stop", "suspend", "hibernate"]);
/** Statuses that mean a stop hasn't begun reporting yet — still in-flight. */
const STOP_IN_FLIGHT_STATUSES = new Set(["active", "running", "spawning"]);
/** Statuses that are always transitional regardless of the initiating action. */
const TRANSITIONAL_POLL_STATUSES = new Set([
  "provisioning",
  "pending",
  "awaiting_manual_provisioning",
]);

/**
 * Decide whether the action-driven provisioning poll should fire again.
 *
 * The backend normalises a just-stopped VM's provider `stopping` → `provisioning`
 * only once the provider starts reporting the shutdown; until then the record
 * still reads `active`/`running`. A stop-poll must therefore treat those as
 * in-flight and keep watching, or it dies on the first tick and every HeroBanner
 * button latches disabled until a hard reload.
 *
 * @param actionKey the action that started the poll (e.g. "stop", "start")
 * @param status    the latest instance status just read from the refetch
 * @param attempts  how many polls have already run this cycle
 */
export const shouldContinueInstancePoll = (
  actionKey: string | null,
  status: string | null | undefined,
  attempts: number
): boolean => {
  if (attempts >= PROVISIONING_POLL_MAX_ATTEMPTS) return false;

  const normalized = String(status ?? "").toLowerCase();
  // Transitional (or not-yet-known) statuses: keep polling for any action.
  if (normalized === "" || TRANSITIONAL_POLL_STATUSES.has(normalized)) return true;

  const action = String(actionKey ?? "").toLowerCase();
  if (STOP_LIKE_ACTIONS.has(action)) {
    // active/running/spawning → the stop hasn't begun reporting; keep watching.
    // Anything else (suspended/stopped/failed/…) is terminal → stop.
    return STOP_IN_FLIGHT_STATUSES.has(normalized);
  }

  // Start/resume/reboot/etc.: any non-transitional status is the terminal state.
  return false;
};

export const ACTION_LIBRARY: Record<string, ActionConfig> = {
  start: {
    label: "Start",
    description: "Power on and resume workloads",
    icon: Play,
    tone: "success",
    disableOnStatus: (status: string | null | undefined) =>
      ["running", "active", "spawning"].includes((status || "").toLowerCase()),
  },
  stop: {
    label: "Stop",
    description: "Gracefully shut down the VM",
    icon: Square,
    tone: "warning",
    disableOnStatus: (status: string | null | undefined) =>
      !["running", "active"].includes((status || "").toLowerCase()),
  },
  reboot: {
    label: "Reboot",
    description: "Restart to apply configuration changes",
    icon: RotateCw,
    tone: "info",
    disableOnStatus: (status: string | null | undefined) =>
      !["running", "active"].includes((status || "").toLowerCase()),
  },
  suspend: {
    label: "Suspend",
    description: "Pause workloads without shutting down",
    icon: Pause,
    tone: "info",
    disableOnStatus: (status: string | null | undefined) =>
      !["running", "active"].includes((status || "").toLowerCase()),
  },
  hibernate: {
    label: "Hibernate",
    description: "Persist state and power down the VM",
    icon: Moon,
    tone: "info",
    disableOnStatus: (status: string | null | undefined) =>
      !["running", "active"].includes((status || "").toLowerCase()),
  },
  resume: {
    label: "Resume",
    description: "Bring the instance back online",
    icon: Play,
    tone: "success",
    disableOnStatus: (status: string | null | undefined) =>
      !["suspended", "paused", "hibernated"].includes((status || "").toLowerCase()),
  },
  snapshot: {
    label: "Snapshot",
    description: "Capture current disk state",
    icon: Camera,
    tone: "info",
  },
  resize: {
    label: "Resize",
    description: "Change compute resources",
    icon: Maximize,
    tone: "info",
  },
  retry_provisioning: {
    label: "Retry Provisioning",
    description: "Requeue provisioning from the last successful step",
    icon: RotateCw,
    tone: "warning",
    disableOnStatus: (status: string | null | undefined) =>
      !["pending", "failed", "error", "awaiting_manual_provisioning"].includes(
        (status || "").toLowerCase()
      ),
  },
  sync_provisioning: {
    label: "Sync Provisioning",
    description: "Sync local state with the provider",
    icon: RefreshCw,
    tone: "info",
    disableOnStatus: (status: string | null | undefined) =>
      !["pending", "failed", "error", "awaiting_manual_provisioning", "provisioning"].includes(
        (status || "").toLowerCase()
      ),
  },
  destroy: {
    label: "Destroy",
    description: "Permanently delete this instance",
    icon: Trash2,
    tone: "danger",
  },
  refresh: {
    label: "Refresh Status",
    description: "Pull latest provider telemetry",
    icon: RefreshCw,
    tone: "neutral",
  },
};

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
};

export const formatDateTime = (value: unknown) => {
  if (!value) return "N/A";
  const parsed = new Date(value as string | number | Date);
  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const safeParseJson = (value: unknown, fallback: unknown = null) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    // Failed to parse JSON payload
    return fallback;
  }
};

export const formatMoney = (amount: unknown, currencyCode?: string | null) => {
  if (amount === null || amount === undefined) return "\u2014";
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return "\u2014";
  const prefix = currencyCode ? `${currencyCode} ` : "";
  return `${prefix}${numeric.toLocaleString()}`;
};

export const formatStatusText = (value: unknown) => {
  if (!value) return "N/A";
  return value
    .toString()
    .replaceAll("_", " ")
    .replaceAll(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Coerce a single tag value into a display string.
 *
 * Tags arrive in several shapes depending on the producer:
 *  - plain strings ("env:prod")
 *  - key/value objects ({ key, value } or { Key, Value }) → "key: value"
 *  - bare value objects ({ value } / { Value } / { name }) → the value
 *  - anything else → JSON, never "[object Object]"
 *
 * Returns null for empty/whitespace results so callers can drop them.
 */
export const normalizeTag = (tag: unknown): string | null => {
  if (tag === null || tag === undefined) return null;
  if (typeof tag === "string") {
    const trimmed = tag.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof tag === "number" || typeof tag === "boolean") {
    return String(tag);
  }
  if (typeof tag === "object") {
    const record = tag as Record<string, unknown>;
    const key = record["key"] ?? record["Key"] ?? record["name"] ?? record["Name"];
    const value =
      record["value"] ?? record["Value"] ?? record["val"] ?? record["Val"];
    if (key !== undefined && key !== null && value !== undefined && value !== null) {
      return `${String(key)}: ${String(value)}`;
    }
    if (value !== undefined && value !== null) return String(value);
    if (key !== undefined && key !== null) return String(key);
    try {
      const json = JSON.stringify(tag);
      return json && json !== "{}" ? json : null;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Normalize an arbitrary tags payload (array of strings/objects, a
 * comma-separated string, or null) into a clean string[] with no
 * "[object Object]" leaks and no empty entries.
 */
/**
 * Internal provisioning bookkeeping written to the instance `tags` field
 * (key_name, created_eip_ids, …). These are never surfaced as user-facing tags.
 */
const INTERNAL_TAG_KEYS = new Set<string>([
  "key_name",
  "created_eip_ids",
  "created_volume_ids",
  "created_volume_map",
  "data_volumes",
  "volumes_to_attach",
  "provisioning_warning",
  "public_ip_unavailable",
]);

export const normalizeTags = (tags: unknown): string[] => {
  if (!tags) return [];
  // A plain object `tags` is a key→value map (or internal bookkeeping). Render
  // each user entry as "key: value" and DROP internal provisioning keys, so the
  // Tags chip never leaks internal data (key_name, created_eip_ids, …).
  if (!Array.isArray(tags) && typeof tags === "object") {
    return Object.entries(tags as Record<string, unknown>)
      .filter(
        ([k, v]) =>
          !INTERNAL_TAG_KEYS.has(k) && v !== null && v !== undefined && v !== "",
      )
      .map(
        ([k, v]) =>
          `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`,
      );
  }
  const list: unknown[] = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
      ? tags.split(",")
      : [tags];
  return list
    .map((t) => normalizeTag(t))
    .filter((t): t is string => t !== null);
};

export type NetworkRowFields = {
  ip: string | undefined;
  mac: string | undefined;
  subnet: string | undefined;
  cidr: string | undefined;
  dnsName: string | undefined;
  deviceIndex: number | string | undefined;
  portId: string | undefined;
};

/**
 * Map a single NIC record from `network_info.flat_addresses` to the eight
 * fields the Networks table renders. Accepts the backend's snake_case keys
 * plus a few OpenStack-style aliases so older payloads still resolve.
 */
export const mapNetworkInterfaceRow = (row: GenericRecord): NetworkRowFields => ({
  ip: (row["addr"] || row["ip_address"] || row["ip"]) as string | undefined,
  mac: (row["mac_addr"] || row["OS-EXT-IPS-MAC:mac_addr"] || row["mac_address"]) as
    | string
    | undefined,
  subnet: (row["subnet_name"] || row["subnet"] || row["network_name"]) as string | undefined,
  cidr: row["cidr"] as string | undefined,
  dnsName: row["dns_name"] as string | undefined,
  deviceIndex: row["device_index"] as number | string | undefined,
  portId: (row["port_id"] || row["network_id"]) as string | undefined,
});

export const formatDuration = (seconds: unknown) => {
  if (seconds === null || seconds === undefined) return null;
  const totalSeconds = Number(seconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return null;
  }
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length && secs) parts.push(`${secs}s`);
  return parts.join(" ") || "0s";
};

export const formatPercentage = (value: unknown) => {
  if (value === null || value === undefined) return "\u2014";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "\u2014";
  if (Math.abs(numeric) < 0.01) return "0%";
  return `${Math.abs(numeric) < 10 ? numeric.toFixed(1) : Math.round(numeric)}%`;
};

export const buildToneClass = (tone: ActionTone | string | undefined) => {
  switch (tone) {
    case "success":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100";
    case "warning":
      return "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100";
    case "danger":
      return "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100";
    case "info":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100";
  }
};

export const getStatusTone = (status: string | undefined): ActionTone => {
  const s = (status || "").toLowerCase();
  if (["running", "active"].includes(s)) return "success";
  if (["stopped", "error", "failed"].includes(s)) return "danger";
  return "info";
};

// ---------------------------------------------------------------------------
// Telemetry metric builders
// ---------------------------------------------------------------------------

export const resolveTelemetrySource = (
  displayInstance: DisplayInstance | undefined,
  effectiveMetadata: GenericRecord | null,
  lifecycleData: LifecycleDataSource,
  monitoringMetrics: InstanceTelemetry | GenericRecord | null
) => {
  const lifecycleRecord: LifecycleData | null = Array.isArray(lifecycleData)
    ? null
    : ((lifecycleData as LifecycleData | null) ?? null);
  const metricsSource =
    (monitoringMetrics && typeof monitoringMetrics === "object" ? monitoringMetrics : null) || {};

  const metricsSourceRecord = (metricsSource || {}) as GenericRecord;
  const telemetry =
    ((metricsSourceRecord["telemetry"] ||
      lifecycleRecord?.["telemetry"] ||
      lifecycleRecord?.["data"]?.["telemetry"] ||
      effectiveMetadata?.["telemetry"] ||
      displayInstance?.["telemetry"] ||
      metricsSource) as InstanceTelemetry) || {};

  return { metricsSource, telemetry };
};

export const getHealthMetric = (
  metricsSource: InstanceTelemetry | GenericRecord,
  telemetry: InstanceTelemetry,
  displayInstance: DisplayInstance | undefined
) => {
  const healthStatus =
    metricsSource["health_status"] ||
    telemetry?.["health"] ||
    telemetry?.["status"] ||
    displayInstance?.status;
  if (!healthStatus) return null;
  return {
    label: "Health",
    value: formatStatusText(healthStatus),
  };
};

export const getUptimeMetric = (
  metricsSource: InstanceTelemetry | GenericRecord,
  telemetry: InstanceTelemetry,
  displayInstance: DisplayInstance | undefined
) => {
  const uptime =
    telemetry?.["uptime_seconds"] ??
    telemetry?.["uptime"] ??
    metricsSource["uptime"] ??
    displayInstance?.uptime_seconds;
  const uptimeFormatted = formatDuration(uptime);
  if (!uptimeFormatted) return null;
  return {
    label: "Uptime",
    value: uptimeFormatted,
  };
};

export const getCpuMetric = (
  metricsSource: InstanceTelemetry | GenericRecord,
  telemetry: InstanceTelemetry
) => {
  const cpuMetric =
    telemetry?.["cpu_usage"] ??
    telemetry?.["cpu"] ??
    metricsSource["cpu_usage"] ??
    metricsSource["cpu"];
  if (cpuMetric === undefined || cpuMetric === null) return null;
  const cpuValue = typeof cpuMetric === "number" ? formatPercentage(cpuMetric) : cpuMetric;
  if (!cpuValue) return null;
  return {
    label: "CPU Usage",
    value: cpuValue as string,
  };
};

export const getMemoryMetric = (
  metricsSource: InstanceTelemetry | GenericRecord,
  telemetry: InstanceTelemetry,
  displayInstance: DisplayInstance | undefined
) => {
  const totalMemoryMb = Number(displayInstance?.compute?.memory_mb);
  const memoryUsageRaw =
    telemetry?.["memory_used_mb"] ??
    telemetry?.["memory_usage"] ??
    telemetry?.["memory"]?.["used_mb"] ??
    telemetry?.["memory"]?.["usage"] ??
    metricsSource?.["memory_usage"];
  const memoryUsage = Number(memoryUsageRaw);

  if (Number.isFinite(memoryUsage) && Number.isFinite(totalMemoryMb) && totalMemoryMb > 0) {
    const usedGiB = Math.max(0, Math.round(memoryUsage / 1024));
    const totalGiB = Math.max(0, Math.round(totalMemoryMb / 1024));
    return {
      label: "Memory",
      value: `${usedGiB} / ${totalGiB} GiB`,
    };
  }
  if (typeof memoryUsageRaw === "string") {
    return {
      label: "Memory",
      value: memoryUsageRaw,
    };
  }
  return null;
};

export const getNetworkMetric = (
  metricsSource: InstanceTelemetry | GenericRecord,
  telemetry: InstanceTelemetry
) => {
  const networkThroughput =
    telemetry?.["network_throughput"] ??
    telemetry?.["network"]?.["throughput"] ??
    telemetry?.["network_transfer_rate"] ??
    metricsSource?.["network_io"];

  if (networkThroughput === undefined || networkThroughput === null) return null;

  const throughput = Number(networkThroughput);
  let displayValue: string | null = null;

  if (Number.isFinite(throughput)) {
    displayValue =
      throughput >= 1000
        ? `${(throughput / 1000).toFixed(1)} Gbps`
        : `${throughput.toFixed(1)} Mbps`;
  } else if (typeof networkThroughput === "string") {
    displayValue = networkThroughput;
  }

  if (!displayValue) return null;
  return {
    label: "Network",
    value: displayValue,
  };
};

export const getLastHeartbeatMetric = (
  metricsSource: InstanceTelemetry | GenericRecord,
  telemetry: InstanceTelemetry
) => {
  const lastHeartbeat =
    telemetry?.["last_heartbeat"] ||
    telemetry?.["last_check_in"] ||
    telemetry?.["updated_at"] ||
    metricsSource?.["last_updated"];
  if (!lastHeartbeat) return null;
  return {
    label: "Last heartbeat",
    value: formatDateTime(lastHeartbeat),
  };
};

export const buildTelemetryMetrics = (
  displayInstance: DisplayInstance | undefined,
  effectiveMetadata: GenericRecord | null,
  lifecycleData: LifecycleDataSource,
  monitoringMetrics: InstanceTelemetry | GenericRecord | null
): Array<{ label: string; value: string }> => {
  const { metricsSource, telemetry } = resolveTelemetrySource(
    displayInstance,
    effectiveMetadata,
    lifecycleData,
    monitoringMetrics
  );

  const metrics = [
    getHealthMetric(metricsSource, telemetry, displayInstance),
    getUptimeMetric(metricsSource, telemetry, displayInstance),
    getCpuMetric(metricsSource, telemetry),
    getMemoryMetric(metricsSource, telemetry, displayInstance),
    getNetworkMetric(metricsSource, telemetry),
    getLastHeartbeatMetric(metricsSource, telemetry),
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return metrics;
};
