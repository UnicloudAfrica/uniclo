import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Camera,
  Copy,
  Globe,
  HardDrive,
  Layers,
  Link as LinkIcon,
  Maximize,
  Moon,
  Network,
  Pause,
  Play,
  RefreshCw,
  RotateCw,
  Server,
  Shield,
  Sparkles,
  Square,
  Terminal,
  Trash2,
  Wallet,
  Zap,
  Loader2,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton, ModernCard } from "../../shared/components/ui";
import ModernTable from "../../shared/components/ui/ModernTable";
import StatusPill from "../../shared/components/ui/StatusPill";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import ModernInput from "../../shared/components/ui/ModernInput";
import ToastUtils from "../../utils/toastUtil";
import { encodeProjectId } from "../../shared/domains/projects/utils/projectHelpers";
import {
  useFetchInstanceManagementDetails,
  useInstanceManagementAction,
  useRefreshInstanceStatus,
  useInstanceUsageStats,
  useInstanceLogs,
  useUpdateInstanceMetadata,
} from "../../hooks/adminHooks/instancesHook";
import {
  useAdminFetchInstanceConsoleById,
  useAdminFetchInstanceLifecycleById,
} from "../../hooks/sharedResourceHooks";

interface InstanceCompute {
  vcpus?: number;
  memory_mb?: number | string;
  productable_name?: string;
  name?: string;
}

interface InstanceVolumeType {
  name?: string;
}

interface InstanceProject {
  name?: string;
  identifier?: string;
  id?: string;
}

interface InstanceTelemetry {
  uptime_seconds?: number;
  uptime?: number;
  cpu_usage?: number | string;
  cpu?: number | string;
  memory_used_mb?: number | string;
  memory_usage?: number | string;
  memory?: { used_mb?: number; usage?: number };
  network_throughput?: number | string;
  network?: { throughput?: number | string };
  network_transfer_rate?: number | string;
  network_io?: number | string; // legacy support
  last_heartbeat?: string;
  last_check_in?: string;
  updated_at?: string;
  health_status?: string;
  health?: string;
  status?: string;
  last_updated?: string;
}

interface InstanceUsageStats {
  cpu_average?: number | string;
  memory_average?: number | string;
  network_in?: number | string;
  network_out?: number | string;
  disk_read?: number | string;
  disk_write?: number | string;
  period?: string;
}

interface PricingLine {
  name?: string;
  quantity?: number;
  unit_amount?: number;
  unitAmount?: number;
  unit_price?: number;
  price?: number;
  total?: number;
  amount?: number;
  frequency?: string;
  currency?: string;
  key?: string;
  id?: string;
}

interface PricingBreakdown {
  lines?: PricingLine[];
  subtotal?: number;
  pre_discount_subtotal?: number;
  preDiscountSubtotal?: number;
  discount?: number;
  discount_label?: string;
  discountLabel?: string;
  tax?: number;
  total?: number;
  colocation_percentage?: number;
  facility_percentage?: number;
  colocation_amount?: number;
  facility_amount?: number;
  currency?: string;
}

interface LifecycleData {
  telemetry?: InstanceTelemetry;
  data?: { telemetry?: InstanceTelemetry };
}

export interface DisplayInstance {
  [key: string]: unknown;
  name?: string;
  description?: string;
  tags?: string[] | string;
  identifier?: string;
  region?: string;
  status?: string;
  billing_status?: string;
  fulfillment_mode?: string;
  project?: InstanceProject;
  provider?: string;
  floating_ip?: { ip_address?: string };
  private_ip?: string;
  compute?: InstanceCompute;
  compute_details?: InstanceCompute;
  storage_size_gb?: number;
  storage_gb?: number;
  disk_gb?: number;
  volume_type?: InstanceVolumeType;
  transactions?: GenericRecord[];
  telemetry?: InstanceTelemetry;
  created_at?: string;
  updated_at?: string;
  next_billing_date?: string;
  expires_at?: string;
  uptime_seconds?: number;
  currency?: string;
  metadata?: Record<string, unknown> | null;
  os_image?: { name?: string };
  key_pair?: { name?: string };
  security_group_ids?: string[];
}

// Temporary fallback for complex unseen shapes, but stricter than 'any'
export type GenericRecord = Record<string, unknown>;

export type LifecycleDataSource = LifecycleData | GenericRecord[] | null;

type ActionTone = "success" | "warning" | "danger" | "info" | "neutral";

type ActionConfig = {
  label: string;
  description: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone: ActionTone;
  disableOnStatus?: (status: string | null | undefined) => boolean;
  requires_confirmation?: boolean;
  confirmation_message?: string;
  default_params?: Record<string, unknown>;
};

type LifecycleEvent = {
  id: string;
  label: string;
  status?: string | undefined;
  description?: string;
  timestamp?: string | number | Date | null;
  timestampLabel: string;
};

type ResourceVolume = {
  id?: string | number | null;
  name?: string;
  volume_label?: string;
  size?: string | number | null;
  size_gb?: string | number | null;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
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

const USAGE_PERIOD_OPTIONS = [
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const LOG_LINE_OPTIONS = [50, 100, 200, 500];
const PROVISIONING_POLL_INTERVAL_MS = 5000;
const PROVISIONING_POLL_MAX_ATTEMPTS = 6;

const ACTION_LIBRARY: Record<string, ActionConfig> = {
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
const formatDateTime = (value: unknown) => {
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
const safeParseJson = (value: unknown, fallback: unknown = null) => {
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
const formatMoney = (amount: unknown, currencyCode?: string | null) => {
  if (amount === null || amount === undefined) return "—";
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return "—";
  const prefix = currencyCode ? `${currencyCode} ` : "";
  return `${prefix}${numeric.toLocaleString()}`;
};
const formatStatusText = (value: unknown) => {
  if (!value) return "N/A";
  return value
    .toString()
    .replaceAll("_", " ")
    .replaceAll(/\b\w/g, (char) => char.toUpperCase());
};
const formatDuration = (seconds: unknown) => {
  if (seconds === null || seconds === undefined) return null;
  const totalSeconds = Number(seconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return null;
  }
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length && secs) parts.push(`${secs}s`);
  return parts.join(" ") || "0s";
};
const formatPercentage = (value: unknown) => {
  if (value === null || value === undefined) return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  if (Math.abs(numeric) < 0.01) return "0%";
  return `${Math.abs(numeric) < 10 ? numeric.toFixed(1) : Math.round(numeric)}%`;
};
const buildToneClass = (tone: ActionTone | string | undefined) => {
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

const getStatusTone = (status: string | undefined): ActionTone => {
  const s = (status || "").toLowerCase();
  if (["running", "active"].includes(s)) return "success";
  if (["stopped", "error", "failed"].includes(s)) return "danger";
  return "info";
};
const resolveTelemetrySource = (
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

const getHealthMetric = (
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

const getUptimeMetric = (
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

const getCpuMetric = (
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
    value: cpuValue,
  };
};

const getMemoryMetric = (
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

const getNetworkMetric = (
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
  let displayValue = null;

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

const getLastHeartbeatMetric = (
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

const buildTelemetryMetrics = (
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

const AdminInstancesDetails = () => {
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [usagePeriod, setUsagePeriod] = useState("24h");
  const [logLines, setLogLines] = useState(200);
  const [metadataForm, setMetadataForm] = useState({
    name: "",
    description: "",
    tags: "",
  });
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isConsoleLoading, setIsConsoleLoading] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const provisioningPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const provisioningPollAttemptsRef = useRef(0);
  const provisioningPollTokenRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const identifier = params.get("identifier");
    if (identifier && identifier.trim()) {
      setInstanceId(identifier.trim());
      setIdentifierError(null);
    } else {
      setInstanceId(null);
      setIdentifierError("No instance identifier was provided in the URL.");
    }
  }, []);

  const {
    data: managementDetailsRaw,
    isFetching: isManagementFetching,
    isError: isManagementError,
    error: managementError,
    refetch: refetchManagement,
  } = useFetchInstanceManagementDetails(instanceId ?? "", {
    enabled: !!instanceId,
  });
  const managementDetails = (managementDetailsRaw as GenericRecord | null) ?? null;

  const managedInstance = (managementDetails?.["instance"] as GenericRecord | null) || null;
  const displayInstance = useMemo<DisplayInstance>(
    () => (managedInstance as unknown as DisplayInstance) || {},
    [managedInstance]
  );
  const instanceIdentifier = (managedInstance?.["identifier"] as string | undefined) || instanceId;
  const providerDetails = managementDetails?.["provider_details"];
  const availableActions = useMemo<Record<string, unknown>>(
    () => (managementDetails?.["available_actions"] as Record<string, unknown>) || {},
    [managementDetails]
  );
  const supportsInstanceActions = Boolean(managementDetails?.["supports_instance_actions"]);
  const networkInfo = managementDetails?.["network_info"] as GenericRecord | undefined;
  const securityInfo = managementDetails?.["security_info"] as GenericRecord | undefined;
  const monitoringMetrics = managementDetails?.["monitoring_metrics"] as GenericRecord | undefined;

  const consoleResourceId =
    (managedInstance?.["identifier"] as string | undefined) ||
    instanceIdentifier ||
    (managedInstance?.["id"] as string | undefined);

  const {
    data: lifecycleDataRaw,
    isLoading: isLifecycleLoading,
    refetch: refetchLifecycle,
  } = useAdminFetchInstanceLifecycleById(instanceIdentifier);
  const lifecycleData = lifecycleDataRaw as LifecycleData | LifecycleData[] | null;

  const { refetch: fetchConsoleUrl, isFetching: isConsoleFetching } =
    useAdminFetchInstanceConsoleById(consoleResourceId, {
      enabled: false,
    });

  const { mutateAsync: executeActionMutation, isPending: isActionMutating } =
    useInstanceManagementAction();
  const { mutateAsync: refreshStatusMutation, isPending: isRefreshingStatus } =
    useRefreshInstanceStatus();
  const { data: usageStatsRaw, isFetching: isUsageLoading } = useInstanceUsageStats(
    instanceIdentifier ?? "",
    usagePeriod,
    {
      enabled: !!instanceIdentifier,
    }
  );
  const usageStats = (usageStatsRaw as GenericRecord | null) ?? null;
  const {
    data: logsDataRaw,
    isFetching: isLogsLoading,
    refetch: refetchLogs,
  } = useInstanceLogs(
    instanceIdentifier ?? "",
    { lines: logLines },
    { enabled: !!instanceIdentifier }
  );
  const logsData = (logsDataRaw as GenericRecord | null) ?? null;
  const { mutateAsync: updateMetadataMutation, isPending: isMetadataUpdating } =
    useUpdateInstanceMetadata();

  const stopProvisioningPoll = useCallback(() => {
    provisioningPollTokenRef.current += 1;
    if (provisioningPollRef.current) {
      clearTimeout(provisioningPollRef.current);
      provisioningPollRef.current = null;
    }
    setIsAutoSyncing(false);
  }, []);

  const startProvisioningPoll = useCallback(() => {
    if (!instanceIdentifier) return;
    stopProvisioningPoll();
    provisioningPollAttemptsRef.current = 0;
    const pollToken = provisioningPollTokenRef.current + 1;
    provisioningPollTokenRef.current = pollToken;
    setIsAutoSyncing(true);

    const poll = async () => {
      if (provisioningPollTokenRef.current !== pollToken) {
        return;
      }
      if (!instanceIdentifier) {
        stopProvisioningPoll();
        return;
      }

      provisioningPollAttemptsRef.current += 1;
      let nextStatus = null;

      try {
        await refreshStatusMutation(instanceIdentifier);
        const refreshed = await refetchManagement();
        await refetchLifecycle();
        const refreshedData = (refreshed as unknown as GenericRecord | undefined)?.["data"] as
          | GenericRecord
          | undefined;
        const instance = refreshedData?.["instance"] as GenericRecord | undefined;
        nextStatus = String(instance?.["status"] || "").toLowerCase();
      } catch {
        // Auto-sync status poll failed
      }

      if (provisioningPollTokenRef.current !== pollToken) {
        return;
      }

      const shouldContinue =
        provisioningPollAttemptsRef.current < PROVISIONING_POLL_MAX_ATTEMPTS &&
        (!nextStatus ||
          ["provisioning", "pending", "awaiting_manual_provisioning"].includes(nextStatus));

      if (shouldContinue) {
        provisioningPollRef.current = setTimeout(poll, PROVISIONING_POLL_INTERVAL_MS);
        return;
      }

      stopProvisioningPoll();
    };

    poll();
  }, [
    instanceIdentifier,
    refreshStatusMutation,
    refetchManagement,
    refetchLifecycle,
    stopProvisioningPoll,
  ]);

  useEffect(() => {
    return () => stopProvisioningPoll();
  }, [stopProvisioningPoll]);

  useEffect(() => {
    stopProvisioningPoll();
  }, [instanceIdentifier, stopProvisioningPoll]);

  const rawMetadata = displayInstance?.metadata;
  const effectiveMetadata = useMemo<GenericRecord>(
    () => (safeParseJson(rawMetadata, rawMetadata) as GenericRecord) || {},
    [rawMetadata]
  );

  useEffect(() => {
    if (!managedInstance) {
      setMetadataForm({ name: "", description: "", tags: "" });
      return;
    }
    setMetadataForm({
      name: (managedInstance?.["name"] as string) || "",
      description: (managedInstance?.["description"] as string) || "",
      tags: Array.isArray(managedInstance?.["tags"])
        ? (managedInstance?.["tags"] as string[]).join(", ")
        : (managedInstance?.["tags"] as string) || "",
    });
  }, [managedInstance]);

  const pricingBreakdownRaw = useMemo<GenericRecord | null>(() => {
    const pricing = effectiveMetadata?.["pricing_breakdown"];
    if (!pricing) return null;
    return (safeParseJson(pricing, pricing) as GenericRecord | null) || (pricing as GenericRecord);
  }, [effectiveMetadata]);

  const providerVm = useMemo<GenericRecord | null>(() => {
    if (providerDetails && typeof providerDetails === "object") {
      return providerDetails as GenericRecord;
    }
    const raw =
      effectiveMetadata?.["provider_vm"] ?? effectiveMetadata?.["provider_vm_snapshot"] ?? null;
    return (safeParseJson(raw, raw) as GenericRecord | null) || null;
  }, [effectiveMetadata, providerDetails]);

  const providerSnapshot = useMemo(() => {
    if (!providerVm || typeof providerVm !== "object") return null;
    const vm = providerVm as GenericRecord;
    return {
      providerStatus: vm["status"],
      vmState: vm["vm_state"] ?? vm["vmState"],
      powerState: vm["power_state"] ?? vm["powerState"],
      taskState: vm["task_state"] ?? vm["taskState"],
      host: vm["host"],
      providerVmId: vm["id"],
      providerVmName: vm["name"],
      createdAt: vm["created"],
      updatedAt: vm["updated"],
    };
  }, [providerVm]);
  const networkTopologySummary = useMemo(() => {
    if (networkInfo && typeof networkInfo === "object") {
      const info = networkInfo as GenericRecord;
      const normalizedNetworks: Record<string, unknown> = {};
      const networks = info["networks"];
      if (Array.isArray(networks)) {
        networks.forEach((network: { name?: string; addresses?: unknown[] }) => {
          const name = network?.name || `Network ${Object.keys(normalizedNetworks).length + 1}`;
          normalizedNetworks[name] = network?.addresses || [];
        });
      }
      return {
        networks: normalizedNetworks,
        flatAddresses: (info["flat_addresses"] || info["flatAddresses"] || []) as unknown[],
        publicIps: (info["public_ips"] || info["publicIps"] || []) as unknown[],
        privateIps: (info["private_ips"] || info["privateIps"] || []) as unknown[],
        primaryIp: (info["primary_ip"] || info["primaryIp"]) as string | undefined,
      };
    }
    if (!providerVm || typeof providerVm !== "object") return null;
    const vm = providerVm as GenericRecord;
    return {
      networks: (vm["addresses"] as Record<string, unknown>) || {},
      flatAddresses: (vm["flat_addresses"] as unknown[]) || [],
      publicIps: (vm["public_ips"] as unknown[]) || [],
      privateIps: (vm["private_ips"] as unknown[]) || [],
      primaryIp: vm["primary_ip"] as string | undefined,
    };
  }, [networkInfo, providerVm]);

  const hasNetworkTopology = useMemo(() => {
    if (!networkTopologySummary) return false;
    const { primaryIp, publicIps = [], privateIps = [], networks = {} } = networkTopologySummary;
    return (
      !!primaryIp ||
      publicIps.length > 0 ||
      privateIps.length > 0 ||
      Object.keys(networks).length > 0
    );
  }, [networkTopologySummary]);

  const securitySummary = useMemo(() => {
    if (securityInfo && typeof securityInfo === "object") {
      return {
        keyPair: securityInfo["key_pair"] || securityInfo["keyPair"] || null,
        securityGroups: securityInfo["security_groups"] || securityInfo["securityGroups"] || [],
        attachedVolumes: securityInfo["volumes"] || securityInfo["volumes_attached"] || [],
        createdVolumeIds: securityInfo["created_volume_ids"] || [],
        createdElasticIps: securityInfo["created_eip_ids"] || [],
      };
    }
    const vm = providerVm as GenericRecord | null;
    return {
      keyPair:
        (vm?.["key_name"] as string | undefined) ??
        (effectiveMetadata?.["key_name"] as string | undefined) ??
        ((displayInstance?.["key_pair"] as GenericRecord | undefined)?.["name"] as
          | string
          | undefined) ??
        null,
      securityGroups:
        (vm?.["security_groups"] as unknown[]) ??
        (effectiveMetadata?.["security_groups"] as unknown[]) ??
        (displayInstance?.["security_group_ids"] as string[] | undefined) ??
        [],
      attachedVolumes: (vm?.["volumes_attached"] as unknown[]) || [],
      createdVolumeIds: (effectiveMetadata?.["created_volume_ids"] as unknown[]) || [],
      createdElasticIps: (effectiveMetadata?.["created_eip_ids"] as unknown[]) || [],
    };
  }, [displayInstance, effectiveMetadata, providerVm, securityInfo]);

  const securitySummaryEntries = useMemo(() => {
    if (!securitySummary) return [];
    return [
      {
        label: "Key Pair",
        value: securitySummary.keyPair || "N/A",
      },
      {
        label: "Security Groups",
        chips: Array.isArray(securitySummary.securityGroups) ? securitySummary.securityGroups : [],
      },
      {
        label: "Attached Volumes",
        volumes: Array.isArray(securitySummary.attachedVolumes)
          ? securitySummary.attachedVolumes
          : [],
      },
      {
        label: "Provisioned Elastic IPs",
        value: Array.isArray(securitySummary.createdElasticIps)
          ? securitySummary.createdElasticIps.length
            ? securitySummary.createdElasticIps.join(", ")
            : "None"
          : "None",
      },
      {
        label: "Provisioned Data Volumes",
        value: Array.isArray(securitySummary.createdVolumeIds)
          ? securitySummary.createdVolumeIds.length
            ? securitySummary.createdVolumeIds.join(", ")
            : "None"
          : "None",
      },
    ];
  }, [securitySummary]);

  const hasSecurityDetails = useMemo(
    () =>
      securitySummaryEntries.some(
        (entry) =>
          (typeof entry.value === "string" && entry.value !== "N/A" && entry.value !== "None") ||
          (Array.isArray(entry.chips) && entry.chips.length > 0) ||
          (Array.isArray(entry.volumes) && entry.volumes.length > 0)
      ),
    [securitySummaryEntries]
  );

  const providerSnapshotEntries = useMemo(() => {
    if (!providerSnapshot) return [];
    return [
      {
        label: "Provider Status",
        value: formatStatusText(providerSnapshot.providerStatus),
      },
      {
        label: "VM State",
        value: formatStatusText(providerSnapshot.vmState),
      },
      {
        label: "Power State",
        value: providerSnapshot.powerState ?? "N/A",
      },
      {
        label: "Task State",
        value: providerSnapshot.taskState ?? "N/A",
      },
      { label: "Host", value: providerSnapshot.host || "N/A" },
      {
        label: "Provider VM ID",
        value: providerSnapshot.providerVmId || "N/A",
        copyable: !!providerSnapshot.providerVmId,
      },
      {
        label: "Provider VM Name",
        value: providerSnapshot.providerVmName || "N/A",
      },
      {
        label: "Created",
        value: providerSnapshot.createdAt ? formatDateTime(providerSnapshot.createdAt) : "N/A",
      },
      {
        label: "Last Updated",
        value: providerSnapshot.updatedAt ? formatDateTime(providerSnapshot.updatedAt) : "N/A",
      },
    ];
  }, [providerSnapshot]);

  const lifecycleEvents = useMemo(() => {
    const events: LifecycleEvent[] = [];
    const asRecord = (value: unknown): GenericRecord | null =>
      value && typeof value === "object" && !Array.isArray(value) ? (value as GenericRecord) : null;
    const asRecordArray = (value: unknown): GenericRecord[] | null =>
      Array.isArray(value) ? (value as GenericRecord[]) : null;

    const lifecycleRecord: GenericRecord | null = Array.isArray(lifecycleData)
      ? null
      : asRecord(lifecycleData);
    const recordEvents = asRecordArray(lifecycleRecord?.["events"]);
    const dataEvents = asRecordArray(asRecord(lifecycleRecord?.["data"])?.["events"]);
    const rawEvents: GenericRecord[] =
      recordEvents ||
      dataEvents ||
      (Array.isArray(lifecycleData) ? (lifecycleData as GenericRecord[]) : []) ||
      [];

    rawEvents.forEach((event: GenericRecord, index: number) => {
      if (!event) return;
      const status = (event["status"] || event["state"] || event["stage"] || event["event"]) as
        | string
        | undefined;
      const label =
        event["label"] ||
        event["title"] ||
        event["name"] ||
        (status ? status.replaceAll("_", " ") : `Update ${index + 1}`);
      const timestamp =
        event["timestamp"] ||
        event["occurred_at"] ||
        event["created_at"] ||
        event["updated_at"] ||
        event["date"];
      const description =
        event["description"] ||
        event["details"] ||
        event["message"] ||
        event["note"] ||
        event["summary"];

      const eventRecord: LifecycleEvent = {
        id: (event["id"] || event["uuid"] || `${label}-${index}`) as string,
        label: String(label),
        timestamp: timestamp as string | number | Date | null,
        timestampLabel: formatDateTime(timestamp as string | number | Date),
        ...(status ? { status: String(status) } : {}),
      };
      const descriptionText =
        typeof description === "string"
          ? description
          : typeof description === "number"
            ? String(description)
            : null;
      if (descriptionText) {
        eventRecord.description = descriptionText;
      }
      events.push(eventRecord);
    });

    if (!events.length && displayInstance) {
      const fallback = (
        label: string,
        value: string | number | Date | null | undefined,
        description?: string
      ) => {
        if (!value) return;
        const eventRecord: LifecycleEvent = {
          id: `${label}-${value}`,
          label,
          status: label,
          timestamp: value,
          timestampLabel: formatDateTime(value),
        };
        if (description) {
          eventRecord.description = description;
        }
        events.push(eventRecord);
      };
      fallback("Instance created", displayInstance.created_at);
      fallback("Lifecycle refreshed", displayInstance.updated_at);
      fallback("Next billing", displayInstance.next_billing_date, "Next billing cycle");
      fallback("Expires", displayInstance.expires_at);
    }
    return events.sort((a: LifecycleEvent, b: LifecycleEvent) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : Number.NaN;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : Number.NaN;

      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;

      return bTime - aTime;
    });
  }, [displayInstance, lifecycleData]);

  const telemetrySummary = useMemo(() => {
    return buildTelemetryMetrics(
      displayInstance,
      effectiveMetadata as GenericRecord | null,
      lifecycleData as LifecycleData | GenericRecord[] | null,
      monitoringMetrics as InstanceTelemetry | GenericRecord | null
    );
  }, [displayInstance, effectiveMetadata, lifecycleData, monitoringMetrics]);

  const currency =
    (pricingBreakdownRaw?.["currency"] as string) ||
    (displayInstance?.["currency"] as string) ||
    "USD";

  const parsedPricingBreakdown = useMemo<PricingBreakdown | null>(() => {
    const pricing = pricingBreakdownRaw;
    if (!pricing || typeof pricing !== "object") {
      return null;
    }

    const linesArray = Array.isArray(pricing["lines"]) ? (pricing["lines"] as PricingLine[]) : [];

    const normalizedLines = linesArray.map((line: PricingLine, index: number) => ({
      key: line?.["name"] || `line-${index}`,
      name: line?.["name"] || `Line ${index + 1}`,
      quantity: Number(line?.["quantity"] ?? 1),
      unitAmount: Number(
        line?.["unit_amount"] ??
          line?.["unitAmount"] ??
          line?.["unit_price"] ??
          line?.["price"] ??
          0
      ),
      total: Number(line?.["total"] ?? line?.["amount"] ?? 0),
      frequency: (line?.["frequency"] as string) || "recurring",
      currency: (line?.["currency"] ?? currency) as string,
    }));

    const colocationPercentageRaw =
      pricing?.["colocation_percentage"] ?? pricing?.["facility_percentage"] ?? null;
    const colocationAmountRaw =
      pricing?.["colocation_amount"] ?? pricing?.["facility_amount"] ?? null;

    return {
      lines: normalizedLines,
      subtotal: Number(
        pricing?.["subtotal"] ??
          pricing?.["pre_discount_subtotal"] ??
          pricing?.["preDiscountSubtotal"] ??
          0
      ),
      discount: Number(pricing?.["discount"] ?? 0),
      discountLabel: (pricing?.["discount_label"] ?? pricing?.["discountLabel"]) as
        | string
        | undefined,
      tax: Number(pricing?.["tax"] ?? 0),
      total: Number(pricing?.["total"] ?? 0),
      colocationPercentage:
        colocationPercentageRaw === null ? null : Number(colocationPercentageRaw),
      colocationAmount: colocationAmountRaw === null ? null : Number(colocationAmountRaw),
    } as PricingBreakdown;
  }, [currency, pricingBreakdownRaw]);

  const relatedResources = useMemo(() => {
    if (!displayInstance) return [];

    const resources = [];

    if (displayInstance.project?.name) {
      const projectIdentifier =
        displayInstance.project.identifier || displayInstance.project.id || "";
      const projectHref = projectIdentifier
        ? `/admin-dashboard/projects/details?id=${encodeProjectId(String(projectIdentifier))}`
        : null;

      resources.push({
        key: "project",
        label: "Project",
        value: displayInstance.project.name,
        href: projectHref,
        icon: Layers,
      });
    }

    if (displayInstance.provider || displayInstance.region) {
      const combined = [displayInstance.provider, displayInstance.region]
        .filter(Boolean)
        .join(" · ");

      resources.push({
        key: "provider-region",
        label: "Provider & Region",
        value: combined || "—",
        icon: Globe,
      });
    }

    const floatingIp = displayInstance.floating_ip?.ip_address;
    const privateIp = displayInstance.private_ip;
    if (floatingIp) {
      resources.push({
        key: "floating-ip",
        label: "Floating IP",
        value: floatingIp,
        copyable: true,
        icon: Network,
      });
    } else if (privateIp) {
      resources.push({
        key: "private-ip",
        label: "Private IP",
        value: privateIp,
        copyable: true,
        icon: Network,
      });
    }

    const securityGroupsChips = (effectiveMetadata?.["security_groups"] as string[]) || [];
    if (securityGroupsChips.length) {
      resources.push({
        key: "security-groups",
        label: "Security Groups",
        chips: securityGroupsChips,
        icon: Shield,
      });
    }

    const dataVolumesRaw = (effectiveMetadata?.["data_volumes"] as Record<string, unknown>[]) || [];
    if (dataVolumesRaw.length) {
      const volumes = dataVolumesRaw.slice(0, 3).map((vol: GenericRecord) => ({
        id: (vol?.["id"] || vol?.["name"] || vol?.["volume_label"]) as string | undefined,
        name: (vol?.["name"] || vol?.["volume_label"] || "Volume") as string,
        size: (vol?.["size_gb"] ||
          vol?.["volume_size_gb"] ||
          vol?.["storage_size_gb"] ||
          vol?.["capacity_gb"]) as string | number | undefined,
      }));

      resources.push({
        key: "data-volumes",
        label: "Data Volumes",
        volumes,
        extraCount:
          dataVolumesRaw.length > volumes.length ? dataVolumesRaw.length - volumes.length : 0,
        icon: HardDrive,
      });
    }

    return resources;
  }, [displayInstance, effectiveMetadata]);

  const enhancedTransactions = useMemo(() => {
    if (!Array.isArray(displayInstance?.transactions)) {
      return [];
    }

    return displayInstance.transactions.map((tx: GenericRecord) => {
      const metadataStr = tx["metadata"] as string | undefined;
      const parsedMetadata =
        (safeParseJson(metadataStr, metadataStr) as GenericRecord | null) || {};
      const gatewayOptionsStr = tx["payment_gateway_options"] as string | undefined;
      const parsedPaymentOptions = safeParseJson(gatewayOptionsStr, gatewayOptionsStr);

      const paymentOptionsArray = Array.isArray(parsedPaymentOptions)
        ? (parsedPaymentOptions as unknown[])
        : parsedPaymentOptions
          ? [parsedPaymentOptions as unknown]
          : [];

      const breakdown = (parsedMetadata?.["breakdown"] ||
        parsedMetadata?.["pricing_breakdown"] ||
        parsedMetadata?.["pricingBreakdown"] ||
        null) as GenericRecord | null;

      const breakdownLines = (
        Array.isArray(breakdown?.["lines"]) ? breakdown?.["lines"] : []
      ) as unknown[];

      return {
        ...tx,
        _metadata: parsedMetadata,
        _paymentOptions: paymentOptionsArray,
        _breakdown: breakdown,
        _breakdownLines: breakdownLines,
      };
    });
  }, [displayInstance?.transactions]);

  const handleGoBack = () => {
    globalThis.window.location.href = "/admin-dashboard/instances";
  };
  const shareUrl = typeof globalThis !== "undefined" ? globalThis.location.href : "";

  const handleCopyIdentifier = useCallback(() => {
    if (!displayInstance?.identifier) return;
    navigator.clipboard.writeText(displayInstance.identifier);
    ToastUtils.success("Identifier copied to clipboard");
  }, [displayInstance?.identifier]);

  const handleCopyShareLink = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    ToastUtils.success("Link copied to clipboard");
  }, [shareUrl]);

  const handleExportJson = useCallback(() => {
    if (!managedInstance) return;
    const blob = new Blob([JSON.stringify(managedInstance, null, 2)], {
      type: "application/json",
    });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${displayInstance.identifier || "instance"}-details.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(url);
  }, [displayInstance.identifier, managedInstance]);

  const handleRefreshStatus = useCallback(async () => {
    if (isRefreshingStatus) return;
    if (!instanceIdentifier) return;
    setPendingAction("refresh");
    try {
      await refreshStatusMutation(instanceIdentifier);
      ToastUtils.success("Instance status refresh requested");
      await Promise.all([refetchManagement(), refetchLifecycle()]);
    } catch (error) {
      ToastUtils.error(getErrorMessage(error, "Failed to refresh instance status."));
    } finally {
      setPendingAction(null);
    }
  }, [
    instanceIdentifier,
    isRefreshingStatus,
    refreshStatusMutation,
    refetchManagement,
    refetchLifecycle,
  ]);

  const handleInstanceAction = useCallback(
    async (actionKey: string) => {
      if (!supportsInstanceActions) {
        ToastUtils.info("Instance actions are not available for this provider.");
        return;
      }
      if (!instanceIdentifier) {
        ToastUtils.error("Unable to determine instance reference.");
        return;
      }

      const actionConfig = (availableActions?.[actionKey] as ActionConfig | undefined) || null;
      if (!actionConfig && actionKey !== "refresh") {
        ToastUtils.error("This action is not supported for the instance.");
        return;
      }

      if (pendingAction && pendingAction !== actionKey && isActionMutating) {
        ToastUtils.info("Another action is in progress.");
        return;
      }

      if (actionKey === "refresh") {
        await handleRefreshStatus();
        return;
      }

      let confirmed = false;
      if (actionConfig?.requires_confirmation) {
        const confirmationMessage =
          actionConfig?.confirmation_message ||
          `Are you sure you want to ${actionKey} this instance?`;
        confirmed = globalThis.window.confirm(confirmationMessage);
        if (!confirmed) return;
      }

      setPendingAction(actionKey);
      try {
        await executeActionMutation({
          identifier: instanceIdentifier,
          action: actionKey,
          params: actionConfig?.default_params || {},
          confirmed,
        });
        ToastUtils.success(`${formatStatusText(actionKey)} initiated.`);
        if (actionKey === "retry_provisioning") {
          startProvisioningPoll();
        }
        await Promise.all([refetchManagement(), refetchLifecycle()]);
      } catch (error) {
        ToastUtils.error(
          getErrorMessage(error, `Unable to trigger ${actionKey} action right now.`)
        );
      } finally {
        setPendingAction(null);
      }
    },
    [
      availableActions,
      executeActionMutation,
      instanceIdentifier,
      isActionMutating,
      handleRefreshStatus,
      pendingAction,
      refetchLifecycle,
      refetchManagement,
      startProvisioningPoll,
      supportsInstanceActions,
    ]
  );

  const handleOpenConsole = useCallback(async () => {
    if (!consoleResourceId) {
      ToastUtils.error("Instance reference not available for console access.");
      return;
    }
    try {
      setIsConsoleLoading(true);
      const fetchResult = await fetchConsoleUrl();
      const result = (fetchResult.data as GenericRecord | undefined) || {};
      if (fetchResult.isError) {
        throw fetchResult.error;
      }
      const resultData = (result["data"] as GenericRecord | undefined) || result;
      const consoleUrl =
        (resultData?.["url"] as string | undefined) ||
        (resultData?.["console_url"] as string | undefined) ||
        (resultData?.["consoleUrl"] as string | undefined) ||
        (result?.["console_url"] as string | undefined) ||
        (result?.["consoleUrl"] as string | undefined);
      if (!consoleUrl) {
        throw new Error("Console URL unavailable.");
      }
      globalThis.open(consoleUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      ToastUtils.error(getErrorMessage(error, "Unable to open console for this instance."));
    } finally {
      setIsConsoleLoading(false);
    }
  }, [consoleResourceId, fetchConsoleUrl]);

  const handleMetadataSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!instanceIdentifier) return;

      try {
        await updateMetadataMutation({
          identifier: instanceIdentifier,
          payload: {
            name: metadataForm.name || undefined,
            description: metadataForm.description || undefined,
            tags: metadataForm.tags
              ? metadataForm.tags
                  .split(",")
                  .map((tag: string) => tag.trim())
                  .filter((tag: string) => tag.length > 0)
              : [],
          },
        });
        ToastUtils.success("Metadata updated successfully");
        await refetchManagement();
      } catch (error) {
        ToastUtils.error(getErrorMessage(error, "Unable to update metadata right now."));
      }
    },
    [
      instanceIdentifier,
      metadataForm.description,
      metadataForm.name,
      metadataForm.tags,
      refetchManagement,
      updateMetadataMutation,
    ]
  );

  const statsCards = useMemo(() => {
    const computeProps = (displayInstance?.["compute"] || displayInstance?.["compute_details"]) as
      | GenericRecord
      | undefined;
    const vcpusRaw = computeProps?.["vcpus"] || computeProps?.["v_cpus"] || computeProps?.["cores"];
    const cores = vcpusRaw ? Number(vcpusRaw) : 0;
    const memoryMbRaw =
      computeProps?.["memory_mb"] ||
      computeProps?.["memory_mbi"] ||
      computeProps?.["ram"] ||
      computeProps?.["memory"];
    const memoryMb = memoryMbRaw ? Number(memoryMbRaw) : 0;
    const storageGbRaw =
      effectiveMetadata?.["storage_gb"] ||
      effectiveMetadata?.["disk_gb"] ||
      displayInstance?.["storage_gb"] ||
      displayInstance?.["storage_size_gb"];
    const storageGb = storageGbRaw ? Number(storageGbRaw) : 0;
    const totalCost = Number(pricingBreakdownRaw?.["total"] || 0);

    const currentStatus = displayInstance?.["status"];
    const volumeType = displayInstance?.["volume_type"];

    return [
      {
        key: "status",
        title: "Health",
        value:
          telemetrySummary.find((metric) => metric.label === "Health")?.value ||
          formatStatusText((currentStatus || "unknown") as string),
        icon: <Activity size={24} />,
        color: "primary",
        description:
          telemetrySummary.find((metric) => metric.label === "Last heartbeat")?.value ||
          "Monitoring active",
      },
      {
        key: "compute",
        title: "Compute Class",
        value:
          (computeProps as GenericRecord | undefined)?.["productable_name"] ||
          (computeProps as GenericRecord | undefined)?.["name"] ||
          "N/A",
        icon: <Server size={24} />,
        color: "info",
        description:
          cores > 0
            ? `${cores} vCPU • ${memoryMb > 0 ? `${Math.round(memoryMb / 1024)} GiB RAM` : "—"}`
            : "Compute profile",
      },
      {
        key: "storage",
        title: "Primary Storage",
        value: storageGb ? `${storageGb} GiB` : "N/A",
        icon: <HardDrive size={24} />,
        color: "info",
        description:
          (effectiveMetadata?.["storage_type"] as string | undefined) ||
          (volumeType as GenericRecord | undefined)?.["name"] ||
          "Block storage",
      },
      {
        key: "cost",
        title: "Est. Monthly Cost",
        value: typeof totalCost === "number" ? formatMoney(totalCost, currency) : "—",
        icon: <Wallet size={24} />,
        color: "warning",
        description:
          parsedPricingBreakdown?.discount && parsedPricingBreakdown.discount !== 0
            ? `Includes ${formatMoney(Number(parsedPricingBreakdown.discount), currency)} discount`
            : "Pricing snapshot",
      },
    ];
  }, [
    currency,
    displayInstance,
    effectiveMetadata,
    parsedPricingBreakdown?.discount,
    pricingBreakdownRaw,
    telemetrySummary,
  ]);

  const headerActions = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <ModernButton
        variant="ghost"
        size="sm"
        onClick={() => {
          refetchManagement();
          refetchLifecycle();
        }}
        isDisabled={isManagementFetching || isLifecycleLoading}
        leftIcon={
          <RefreshCw
            className={`h-4 w-4 ${
              isManagementFetching || isLifecycleLoading ? "animate-spin" : ""
            }`}
          />
        }
      >
        Refresh
      </ModernButton>
      <ModernButton
        variant="ghost"
        size="sm"
        onClick={handleCopyShareLink}
        leftIcon={<LinkIcon className="h-4 w-4" />}
      >
        Copy Link
      </ModernButton>
      <ModernButton
        variant="outline"
        size="sm"
        onClick={handleOpenConsole}
        isDisabled={isConsoleLoading || isConsoleFetching}
        leftIcon={
          <Terminal
            className={`h-4 w-4 ${isConsoleLoading || isConsoleFetching ? "animate-spin" : ""}`}
          />
        }
      >
        Open Console
      </ModernButton>
      <ModernButton variant="primary" size="sm" onClick={handleExportJson}>
        Export JSON
      </ModernButton>
    </div>
  );

  const logsContent = useMemo(() => {
    if (isLogsLoading) {
      return (
        <div className="flex items-center gap-2 text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          Loading logs...
        </div>
      );
    }
    if (Array.isArray(logsData?.["logs"]) && logsData["logs"].length) {
      return (
        <pre className="whitespace-pre-wrap break-words text-left">
          {logsData["logs"].join("\n")}
        </pre>
      );
    }
    return <span className="text-slate-400">No log lines returned for this interval.</span>;
  }, [isLogsLoading, logsData]);

  const usageContent = useMemo(() => {
    if (isUsageLoading) {
      return (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-slate-500">Loading usage metrics…</span>
        </div>
      );
    }
    const stats = usageStats as InstanceUsageStats | null;
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

  const isLoadingDetails = isManagementFetching && !managementDetails;
  const combinedIsError = isManagementError && !managementDetails;
  const combinedError = managementError;

  if (identifierError) {
    return (
      <AdminPageShell
        title="Instance Details"
        description="Review workload telemetry and lifecycle information."
        contentClassName="flex min-h-[60vh] items-center justify-center"
      >
        <ModernCard padding="lg" className="max-w-md space-y-4 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="text-sm text-gray-600">{identifierError}</p>
          <ModernButton variant="primary" onClick={handleGoBack}>
            Back to instances
          </ModernButton>
        </ModernCard>
      </AdminPageShell>
    );
  }

  if (isLoadingDetails) {
    return (
      <AdminPageShell
        title="Instance Details"
        description="Review workload telemetry and lifecycle information."
        contentClassName="flex min-h-[60vh] items-center justify-center"
      >
        <ModernCard padding="lg" className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-sm text-gray-600">Loading instance details…</span>
        </ModernCard>
      </AdminPageShell>
    );
  }

  if (combinedIsError) {
    return (
      <AdminPageShell
        title="Instance Details"
        description="Review workload telemetry and lifecycle information."
        contentClassName="flex min-h-[60vh] items-center justify-center"
      >
        <ModernCard padding="lg" className="max-w-md space-y-4 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="text-sm text-gray-600">
            {combinedError?.message || "Instance could not be found or is unavailable."}
          </p>
          <ModernButton variant="primary" onClick={handleGoBack}>
            Back to instances
          </ModernButton>
        </ModernCard>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title={displayInstance.name || "Instance"}
      description={
        displayInstance.region
          ? `${displayInstance.region} • ${displayInstance.identifier || "—"}`
          : displayInstance.identifier || "Instance overview"
      }
      actions={headerActions}
      contentClassName="space-y-8"
    >
      <div className="brand-hero rounded-[32px] text-white shadow-2xl">
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between lg:p-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
              <Sparkles size={14} />
              Instance Spotlight
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {displayInstance.name || displayInstance.identifier || "Instance"}
              </h1>
              <p className="max-w-2xl text-sm text-white/80 sm:text-base">
                Stay informed on lifecycle events, resource utilisation, billing, and provider
                telemetry for this workload.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {displayInstance.status && (
                <StatusPill
                  label={formatStatusText(displayInstance.status)}
                  tone={getStatusTone(displayInstance.status)}
                />
              )}
              {displayInstance.billing_status && (
                <StatusPill
                  label={`Billing: ${formatStatusText(displayInstance.billing_status)}`}
                  tone="neutral"
                />
              )}
              {displayInstance.fulfillment_mode && (
                <StatusPill
                  label={`${formatStatusText(displayInstance.fulfillment_mode)} fulfillment`}
                  tone="info"
                />
              )}
            </div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/40 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
              <span className="font-mono">{displayInstance.identifier || "N/A"}</span>
              {displayInstance.identifier && (
                <button
                  onClick={handleCopyIdentifier}
                  className="rounded-full bg-white/10 p-1 text-white transition hover:bg-white/20"
                  title="Copy identifier"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col">
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Instances
            </ModernButton>
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={handleRefreshStatus}
              leftIcon={
                <RefreshCw
                  className={`h-4 w-4 ${pendingAction === "refresh" ? "animate-spin" : ""}`}
                />
              }
              isDisabled={pendingAction === "refresh"}
            >
              Sync status
            </ModernButton>
            {isAutoSyncing && (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                Auto-syncing after retry
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((stat: any) => (
          <ModernStatsCard
            key={stat.key}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <ModernCard padding="xl" className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Action Centre</h2>
            <p className="text-sm text-slate-500">
              Lifecycle controls surface based on provider capabilities and current state.
            </p>
          </div>
          <StatusPill
            label={supportsInstanceActions ? "Actions available" : "Actions disabled"}
            tone={supportsInstanceActions ? "success" : "warning"}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(ACTION_LIBRARY) as string[])
            .filter((actionKey: string) =>
              actionKey === "refresh"
                ? true
                : availableActions?.[actionKey] || supportsInstanceActions
            )
            .map((actionKey: string) => {
              const actionConfig = ACTION_LIBRARY[actionKey] ?? ACTION_LIBRARY["refresh"]!;
              const Icon = actionConfig.icon || RefreshCw;
              const disabled =
                pendingAction === actionKey ||
                (actionConfig.disableOnStatus &&
                  actionConfig.disableOnStatus(displayInstance.status));
              return (
                <button
                  key={actionKey}
                  type="button"
                  onClick={() => handleInstanceAction(actionKey)}
                  disabled={disabled || (actionKey === "refresh" && pendingAction === "refresh")}
                  className={`flex w-full max-w-xs flex-col gap-1 rounded-2xl px-4 py-3 text-left text-sm transition sm:w-auto ${
                    disabled
                      ? "cursor-not-allowed opacity-60 border border-slate-200 bg-slate-100 text-slate-400"
                      : buildToneClass(actionConfig.tone)
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Icon className="h-4 w-4" />
                    {actionConfig.label}
                  </span>
                  <span className="text-xs">{actionConfig.description}</span>
                </button>
              );
            })}
        </div>
      </ModernCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ModernCard padding="xl" className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Instance Overview</h2>
            <p className="text-sm text-slate-500">
              Core configuration, ownership, and related resources for this workload.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Provider
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {displayInstance.provider || "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Region</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {displayInstance.region || "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                OS Image
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {displayInstance.os_image?.name || "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Created
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {displayInstance.created_at ? formatDateTime(displayInstance.created_at) : "N/A"}
              </p>
            </div>
          </div>

          {relatedResources.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Related Resources</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {relatedResources.map((resource: any) => (
                  <div
                    key={resource.key}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      {resource.icon && <resource.icon className="h-4 w-4 text-slate-400" />}
                      {resource.label}
                    </div>
                    {resource.value ? (
                      resource.href ? (
                        <a
                          href={resource.href}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--theme-color)] transition hover:text-[var(--theme-color)]"
                        >
                          {resource.value}
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                        </a>
                      ) : (
                        <p className="mt-2 text-sm text-slate-700">{resource.value}</p>
                      )
                    ) : null}
                    {resource.copyable && resource.value && (
                      <button
                        onClick={() => navigator.clipboard.writeText(resource.value)}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-700"
                      >
                        <Copy className="h-3 w-3" />
                        Copy value
                      </button>
                    )}
                    {resource.chips?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {resource.chips.map((chip: any) => (
                          <span
                            key={chip}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {resource.volumes?.length ? (
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        {resource.volumes.map((vol: ResourceVolume) => (
                          <div
                            key={vol.id || vol.name}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                          >
                            <span className="font-medium text-slate-800">{vol.name}</span>
                            <span className="text-xs uppercase tracking-wide text-slate-500">
                              {vol.size !== undefined && vol.size !== null
                                ? typeof vol.size === "string"
                                  ? vol.size
                                  : `${vol.size} GiB`
                                : "—"}
                            </span>
                          </div>
                        ))}
                        {resource.extraCount ? (
                          <p className="text-xs text-slate-500">
                            +{resource.extraCount} more volume
                            {resource.extraCount > 1 ? "s" : ""}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </ModernCard>

        <div className="space-y-6">
          <ModernCard padding="xl" className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Network &amp; Security</h2>
              <p className="text-sm text-slate-500">
                Connectivity and access controls synchronised from the provider.
              </p>
            </div>

            {hasNetworkTopology ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Primary IP
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {networkTopologySummary?.primaryIp || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Public IPs
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {networkTopologySummary?.publicIps?.length ? (
                      networkTopologySummary.publicIps.map((ip: any) => (
                        <span
                          key={`public-${ip}`}
                          className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                        >
                          {ip}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">None</span>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Private IPs
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {networkTopologySummary?.privateIps?.length ? (
                      networkTopologySummary.privateIps.map((ip: any) => (
                        <span
                          key={`private-${ip}`}
                          className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                        >
                          {ip}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">None</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Network topology is not available for this provider yet.
              </p>
            )}

            {hasSecurityDetails ? (
              <div className="space-y-3">
                {securitySummaryEntries.map((entry: any) => (
                  <div
                    key={entry.label}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {entry.label}
                    </p>
                    {entry.value && (
                      <p className="mt-1 text-sm font-semibold text-slate-900">{entry.value}</p>
                    )}
                    {entry.chips?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entry.chips.map((chip: any) => (
                          <span
                            key={chip}
                            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {entry.volumes?.length ? (
                      <ul className="mt-2 space-y-2 text-xs text-slate-600">
                        {entry.volumes.map((vol: ResourceVolume, index: number) => (
                          <li
                            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                            key={`${vol?.id || vol?.name || index}`}
                          >
                            <span className="font-medium text-slate-800">
                              {vol?.name || vol?.volume_label || "Volume"}
                            </span>
                            {vol?.size_gb ? (
                              <span className="ml-2 text-slate-500">{vol.size_gb} GiB</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </ModernCard>

          {providerSnapshotEntries.length > 0 && (
            <ModernCard padding="xl" className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Provider Snapshot</h2>
                <p className="text-sm text-slate-500">
                  Real-time state synchronised from the underlying infrastructure.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {providerSnapshotEntries.map((entry: any) => (
                  <div
                    key={entry.label}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {entry.label}
                      </p>
                      {entry.copyable && entry.value && entry.value !== "N/A" ? (
                        <button
                          onClick={() => navigator.clipboard.writeText(entry.value)}
                          className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                          title={`Copy ${entry.label}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{entry.value}</p>
                  </div>
                ))}
              </div>
            </ModernCard>
          )}
        </div>
      </div>

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
        {usageStats?.["period"] ? (
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Reporting window: {String(usageStats["period"])}
          </p>
        ) : null}
      </ModernCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ModernCard padding="xl" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lifecycle Timeline</h2>
              <p className="text-sm text-slate-500">
                Status transitions with the most recent events first.
              </p>
            </div>
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={() => refetchLifecycle()}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </ModernButton>
          </div>
          <div className="space-y-4">
            {lifecycleEvents.length ? (
              lifecycleEvents.map((event: LifecycleEvent) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Zap className="h-4 w-4 text-amber-500" />
                      {event.label}
                    </div>
                    <span className="text-xs text-slate-500">{event.timestampLabel}</span>
                  </div>
                  {event.description && (
                    <p className="mt-2 text-sm text-slate-600">{event.description}</p>
                  )}
                  {event.status && (
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                      {formatStatusText(event.status)}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No lifecycle events recorded yet.</p>
            )}
          </div>
        </ModernCard>

        <ModernCard padding="xl" className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Provider Logs</h2>
              <p className="text-sm text-slate-500">
                Recent log lines fetched directly from the compute console.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600" htmlFor="log-lines">
                Lines
              </label>
              <select
                id="log-lines"
                value={logLines}
                onChange={(event) => setLogLines(Number(event.target.value))}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {LOG_LINE_OPTIONS.map((option: number) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ModernButton variant="ghost" size="sm" onClick={() => refetchLogs()}>
                Refresh
              </ModernButton>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-900/95 p-4 text-xs font-mono text-slate-100">
            {logsContent}
          </div>
        </ModernCard>
      </div>

      <ModernCard padding="xl" className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Metadata &amp; Tags</h2>
          <p className="text-sm text-slate-500">
            Update descriptive fields that appear across dashboards.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleMetadataSubmit}>
          <ModernInput
            label="Display Name"
            value={metadataForm.name}
            onChange={(event) =>
              setMetadataForm((prev) => ({
                ...prev,
                name: event.target.value,
              }))
            }
            placeholder="Instance display name"
            id="instance-display-name"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={metadataForm.description}
              onChange={(event) =>
                setMetadataForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Add a short description for this instance"
            />
          </div>
          <ModernInput
            label="Tags"
            value={metadataForm.tags}
            onChange={(event) =>
              setMetadataForm((prev) => ({
                ...prev,
                tags: event.target.value,
              }))
            }
            placeholder="Comma separated tags (e.g. production, finance)"
          />
          <div className="flex justify-end gap-2">
            <ModernButton
              type="button"
              variant="ghost"
              onClick={() =>
                setMetadataForm({
                  name: (managedInstance?.["name"] as string) || "",
                  description: (managedInstance?.["description"] as string) || "",
                  tags: Array.isArray(managedInstance?.["tags"])
                    ? (managedInstance["tags"] as string[]).join(", ")
                    : (managedInstance?.["tags"] as string) || "",
                })
              }
            >
              Reset
            </ModernButton>
            <ModernButton
              type="submit"
              variant="primary"
              isLoading={isMetadataUpdating}
              isDisabled={isMetadataUpdating}
            >
              Save Changes
            </ModernButton>
          </div>
        </form>
      </ModernCard>

      <ModernCard padding="xl" className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Pricing Breakdown</h2>
          <p className="text-sm text-slate-500">
            Monthly cost components as captured during provisioning.
          </p>
        </div>
        {parsedPricingBreakdown ? (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Subtotal
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatMoney(parsedPricingBreakdown.subtotal, currency)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Discount
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {parsedPricingBreakdown.discount
                    ? `-${formatMoney(parsedPricingBreakdown.discount, currency)}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatMoney(parsedPricingBreakdown.tax, currency)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatMoney(parsedPricingBreakdown.total, currency)}
                </p>
              </div>
            </div>
            {parsedPricingBreakdown?.lines?.length ? (
              <ModernTable<PricingLine>
                data={(parsedPricingBreakdown.lines || []).map((line) => ({
                  ...line,
                  id: line.key || line.name || "line",
                }))}
                columns={[
                  {
                    key: "name",
                    header: "LINE ITEM",
                    render: (_: unknown, line: PricingLine) => (
                      <div className="flex flex-col">
                        <span className="font-semibold">{line.name}</span>
                        <span className="text-xs text-slate-500">{line.frequency}</span>
                      </div>
                    ),
                  },
                  {
                    key: "quantity",
                    header: "QUANTITY",
                    render: (val: unknown) => (
                      <span className="text-slate-700">{String(val || "0")}</span>
                    ),
                  },
                  {
                    key: "unitAmount",
                    header: "UNIT AMOUNT",
                    render: (val: unknown, line: PricingLine) => (
                      <span className="text-slate-700">
                        {formatMoney(Number(val || 0), line.currency)}
                      </span>
                    ),
                  },
                  {
                    key: "total",
                    header: "TOTAL",
                    render: (val: unknown, line: PricingLine) => (
                      <span className="text-slate-900">
                        {formatMoney(
                          Number((val as string | number) || 0),
                          (line.currency || currency) as string
                        )}
                      </span>
                    ),
                  },
                ]}
                searchable={false}
                filterable={false}
                exportable={false}
                paginated={false}
                enableAnimations={false}
              />
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Pricing breakdown is not available for this instance.
          </p>
        )}
      </ModernCard>

      <ModernCard padding="xl" className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Transactions</h2>
          <p className="text-sm text-slate-500">
            Recorded payments and reconciled charges linked to this instance.
          </p>
        </div>
        <div className="overflow-x-auto">
          {enhancedTransactions.length ? (
            <ModernTable<GenericRecord>
              data={enhancedTransactions.map((tx: GenericRecord) => ({
                ...tx,
                id: (tx["id"] || tx["reference"]) as string,
              }))}
              columns={[
                {
                  key: "identifier",
                  header: "IDENTIFIER",
                  render: (_: unknown, tx: GenericRecord) => (
                    <span className="font-medium">
                      {String(tx["identifier"] || tx["reference"] || "—")}
                    </span>
                  ),
                },
                {
                  key: "type",
                  header: "TYPE",
                  render: (_: unknown, tx: GenericRecord) => (
                    <span>{formatStatusText(tx["transaction_type"] || tx["type"])}</span>
                  ),
                },
                {
                  key: "amount",
                  header: "AMOUNT",
                  render: (val: unknown, tx: GenericRecord) => (
                    <span>
                      {formatMoney(Number(val || 0), (tx["currency"] || currency) as string)}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "STATUS",
                  render: (val: unknown) => {
                    const s = String(val || "").toLowerCase();
                    let tone: ActionTone = "neutral";
                    if (["success", "paid", "completed"].includes(s)) tone = "success";
                    else if (["failed", "refunded"].includes(s)) tone = "danger";

                    return <StatusPill label={formatStatusText(String(val))} tone={tone} />;
                  },
                },
                {
                  key: "payment_gateway",
                  header: "GATEWAY",
                  render: (_: unknown, tx: GenericRecord) => {
                    const gatewayValue = tx["payment_gateway"] ?? tx["gateway"];
                    const label =
                      gatewayValue !== null && gatewayValue !== undefined && gatewayValue !== ""
                        ? String(gatewayValue)
                        : "—";
                    return <span>{label}</span>;
                  },
                },
                {
                  key: "created_at",
                  header: "CREATED",
                  render: (val: unknown) => (
                    <span>{val ? formatDateTime(val as string | number | Date) : "—"}</span>
                  ),
                },
              ]}
              searchable={false}
              filterable={false}
              exportable={false}
              paginated={false}
              enableAnimations={false}
            />
          ) : (
            <p className="text-sm text-slate-500">
              No billing transactions linked to this instance yet.
            </p>
          )}
        </div>
      </ModernCard>
    </AdminPageShell>
  );
};
export default AdminInstancesDetails;
