import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import StatusPill from "../components/StatusPill";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernInput from "../components/ModernInput";
import ToastUtils from "../../utils/toastUtil";
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

const USAGE_PERIOD_OPTIONS = [
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const LOG_LINE_OPTIONS = [50, 100, 200, 500];

const ACTION_LIBRARY = {
  start: {
    label: "Start",
    description: "Power on and resume workloads",
    icon: Play,
    tone: "success",
    disableOnStatus: (status) =>
      ["running", "active", "spawning"].includes(
        (status || "").toLowerCase()
      ),
  },
  stop: {
    label: "Stop",
    description: "Gracefully shut down the VM",
    icon: Square,
    tone: "warning",
    disableOnStatus: (status) =>
      !["running", "active"].includes((status || "").toLowerCase()),
  },
  reboot: {
    label: "Reboot",
    description: "Restart to apply configuration changes",
    icon: RotateCw,
    tone: "info",
    disableOnStatus: (status) =>
      !["running", "active"].includes((status || "").toLowerCase()),
  },
  suspend: {
    label: "Suspend",
    description: "Pause workloads without shutting down",
    icon: Pause,
    tone: "info",
    disableOnStatus: (status) =>
      !["running", "active"].includes((status || "").toLowerCase()),
  },
  hibernate: {
    label: "Hibernate",
    description: "Persist state and power down the VM",
    icon: Moon,
    tone: "info",
    disableOnStatus: (status) =>
      !["running", "active"].includes((status || "").toLowerCase()),
  },
  resume: {
    label: "Resume",
    description: "Bring the instance back online",
    icon: Play,
    tone: "success",
    disableOnStatus: (status) =>
      !["suspended", "paused", "hibernated"].includes(
        (status || "").toLowerCase()
      ),
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

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const safeParseJson = (value, fallback = null) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Failed to parse JSON payload", error);
    return fallback;
  }
};

const formatMoney = (amount, currencyCode) => {
  if (amount === null || amount === undefined) return "—";
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return "—";
  const prefix = currencyCode ? `${currencyCode} ` : "";
  return `${prefix}${numeric.toLocaleString()}`;
};

const formatStatusText = (value) => {
  if (!value) return "N/A";
  return value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatBoolean = (value, trueLabel = "Yes", falseLabel = "No") =>
  value ? trueLabel : falseLabel;

const formatDuration = (seconds) => {
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

const formatPercentage = (value) => {
  if (value === null || value === undefined) return "—";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "—";
  if (Math.abs(numeric) < 0.01) return "0%";
  return `${Math.abs(numeric) < 10 ? numeric.toFixed(1) : Math.round(numeric)}%`;
};

const buildToneClass = (tone) => {
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

const AdminInstancesDetails = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [instanceId, setInstanceId] = useState(null);
  const [identifierError, setIdentifierError] = useState(null);
  const [usagePeriod, setUsagePeriod] = useState("24h");
  const [logLines, setLogLines] = useState(200);
  const [metadataForm, setMetadataForm] = useState({
    name: "",
    description: "",
    tags: "",
  });
  const [pendingAction, setPendingAction] = useState(null);
  const [isConsoleLoading, setIsConsoleLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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
    data: managementDetails,
    isFetching: isManagementFetching,
    isError: isManagementError,
    error: managementError,
    refetch: refetchManagement,
  } = useFetchInstanceManagementDetails(instanceId, {
    enabled: !!instanceId,
  });

  const managedInstance = managementDetails?.instance || null;
  const displayInstance = managedInstance || {};
  const instanceIdentifier = managedInstance?.identifier || instanceId;
  const providerDetails = managementDetails?.provider_details;
  const availableActions = managementDetails?.available_actions || {};
  const supportsInstanceActions = Boolean(
    managementDetails?.supports_instance_actions
  );
  const networkInfo = managementDetails?.network_info;
  const securityInfo = managementDetails?.security_info;
  const monitoringMetrics = managementDetails?.monitoring_metrics;

  const consoleResourceId =
    managedInstance?.id ||
    managedInstance?.identifier ||
    instanceIdentifier;

  const {
    data: lifecycleData,
    isLoading: isLifecycleLoading,
    refetch: refetchLifecycle,
  } = useAdminFetchInstanceLifecycleById(instanceIdentifier);

  const { refetch: fetchConsoleUrl, isFetching: isConsoleFetching } =
    useAdminFetchInstanceConsoleById(consoleResourceId, {
      enabled: false,
    });

  const { mutateAsync: executeActionMutation, isPending: isActionMutating } =
    useInstanceManagementAction();
  const { mutateAsync: refreshStatusMutation, isPending: isRefreshingStatus } =
    useRefreshInstanceStatus();
  const {
    data: usageStats,
    isFetching: isUsageLoading,
  } = useInstanceUsageStats(instanceIdentifier, usagePeriod, {
    enabled: !!instanceIdentifier,
  });
  const {
    data: logsData,
    isFetching: isLogsLoading,
    refetch: refetchLogs,
  } = useInstanceLogs(
    instanceIdentifier,
    { lines: logLines },
    { enabled: !!instanceIdentifier }
  );
  const { mutateAsync: updateMetadataMutation, isPending: isMetadataUpdating } =
    useUpdateInstanceMetadata();

  const rawMetadata = displayInstance?.metadata;
  const effectiveMetadata = useMemo(
    () => safeParseJson(rawMetadata, rawMetadata) || {},
    [rawMetadata]
  );

  useEffect(() => {
    if (!managedInstance) {
      setMetadataForm({ name: "", description: "", tags: "" });
      return;
    }
    setMetadataForm({
      name: managedInstance.name || "",
      description: managedInstance.description || "",
      tags: Array.isArray(managedInstance.tags)
        ? managedInstance.tags.join(", ")
        : managedInstance.tags || "",
    });
  }, [managedInstance]);

  const pricingBreakdownRaw = useMemo(() => {
    if (!effectiveMetadata?.pricing_breakdown) return null;
    return (
      safeParseJson(
        effectiveMetadata.pricing_breakdown,
        effectiveMetadata.pricing_breakdown
      ) || effectiveMetadata.pricing_breakdown
    );
  }, [effectiveMetadata?.pricing_breakdown]);

  const providerVm = useMemo(() => {
    if (providerDetails && typeof providerDetails === "object") {
      return providerDetails;
    }
    const raw =
      effectiveMetadata?.provider_vm ??
      effectiveMetadata?.provider_vm_snapshot ??
      null;
    return safeParseJson(raw, raw);
  }, [effectiveMetadata, providerDetails]);

  const providerSnapshot = useMemo(() => {
    if (!providerVm || typeof providerVm !== "object") return null;
    return {
      providerStatus: providerVm.status,
      vmState: providerVm.vm_state ?? providerVm.vmState,
      powerState: providerVm.power_state ?? providerVm.powerState,
      taskState: providerVm.task_state ?? providerVm.taskState,
      host: providerVm.host,
      providerVmId: providerVm.id,
      providerVmName: providerVm.name,
      createdAt: providerVm.created,
      updatedAt: providerVm.updated,
    };
  }, [providerVm]);

  const networkTopologySummary = useMemo(() => {
    if (networkInfo && typeof networkInfo === "object") {
      const normalizedNetworks = {};
      if (Array.isArray(networkInfo.networks)) {
        networkInfo.networks.forEach((network) => {
          const name =
            network?.name || `Network ${Object.keys(normalizedNetworks).length + 1}`;
          normalizedNetworks[name] = network?.addresses || [];
        });
      }
      return {
        networks: normalizedNetworks,
        flatAddresses:
          networkInfo.flat_addresses ||
          networkInfo.flatAddresses ||
          [],
        publicIps: networkInfo.public_ips || networkInfo.publicIps || [],
        privateIps: networkInfo.private_ips || networkInfo.privateIps || [],
        primaryIp: networkInfo.primary_ip || networkInfo.primaryIp,
      };
    }

    if (!providerVm || typeof providerVm !== "object") return null;
    return {
      networks: providerVm.addresses || {},
      flatAddresses: providerVm.flat_addresses || [],
      publicIps: providerVm.public_ips || [],
      privateIps: providerVm.private_ips || [],
      primaryIp: providerVm.primary_ip,
    };
  }, [networkInfo, providerVm]);

  const hasNetworkTopology = useMemo(() => {
    if (!networkTopologySummary) return false;
    const { primaryIp, publicIps = [], privateIps = [], networks = {} } =
      networkTopologySummary;
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
        keyPair:
          securityInfo.key_pair ||
          securityInfo.keyPair ||
          null,
        securityGroups:
          securityInfo.security_groups ||
          securityInfo.securityGroups ||
          [],
        attachedVolumes:
          securityInfo.volumes ||
          securityInfo.volumes_attached ||
          [],
        createdVolumeIds: securityInfo.created_volume_ids || [],
        createdElasticIps: securityInfo.created_eip_ids || [],
      };
    }

    return {
      keyPair:
        providerVm?.key_name ??
        effectiveMetadata?.key_name ??
        displayInstance?.key_pair?.name ??
        null,
      securityGroups:
        providerVm?.security_groups ??
        effectiveMetadata?.security_groups ??
        displayInstance?.security_group_ids ??
        [],
      attachedVolumes: providerVm?.volumes_attached || [],
      createdVolumeIds: effectiveMetadata?.created_volume_ids || [],
      createdElasticIps: effectiveMetadata?.created_eip_ids || [],
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
        chips: Array.isArray(securitySummary.securityGroups)
          ? securitySummary.securityGroups
          : [],
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
          (typeof entry.value === "string" &&
            entry.value !== "N/A" &&
            entry.value !== "None") ||
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
        value: providerSnapshot.createdAt
          ? formatDateTime(providerSnapshot.createdAt)
          : "N/A",
      },
      {
        label: "Last Updated",
        value: providerSnapshot.updatedAt
          ? formatDateTime(providerSnapshot.updatedAt)
          : "N/A",
      },
    ];
  }, [providerSnapshot]);

  const lifecycleEvents = useMemo(() => {
    const events = [];
    const rawEvents =
      (Array.isArray(lifecycleData?.events) && lifecycleData.events) ||
      (Array.isArray(lifecycleData?.data?.events) &&
        lifecycleData.data.events) ||
      (Array.isArray(lifecycleData) && lifecycleData) ||
      [];

    rawEvents.forEach((event, index) => {
      if (!event) return;
      const status = event.status || event.state || event.stage || event.event;
      const label =
        event.label ||
        event.title ||
        event.name ||
        (status ? status.replace(/_/g, " ") : `Update ${index + 1}`);
      const timestamp =
        event.timestamp ||
        event.occurred_at ||
        event.created_at ||
        event.updated_at ||
        event.date;
      const description =
        event.description ||
        event.details ||
        event.message ||
        event.note ||
        event.summary;

      events.push({
        id: event.id || event.uuid || `${label}-${index}`,
        label,
        status,
        description,
        timestamp,
        timestampLabel: formatDateTime(timestamp),
      });
    });

    if (!events.length && displayInstance) {
      const fallback = (label, value, description) => {
        if (!value) return;
        events.push({
          id: `${label}-${value}`,
          label,
          status: label,
          description,
          timestamp: value,
          timestampLabel: formatDateTime(value),
        });
      };

      fallback("Instance created", displayInstance.created_at);
      fallback("Lifecycle refreshed", displayInstance.updated_at);
      fallback(
        "Next billing",
        displayInstance.next_billing_date,
        "Next billing cycle"
      );
      fallback("Expires", displayInstance.expires_at);
    }

    return events.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : Number.NaN;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : Number.NaN;

      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;

      return bTime - aTime;
    });
  }, [displayInstance, lifecycleData]);

  const telemetrySummary = useMemo(() => {
    const metricsSource =
      (monitoringMetrics && typeof monitoringMetrics === "object"
        ? monitoringMetrics
        : null) || {};

    const telemetry =
      metricsSource.telemetry ||
      lifecycleData?.telemetry ||
      lifecycleData?.data?.telemetry ||
      effectiveMetadata?.telemetry ||
      displayInstance?.telemetry ||
      metricsSource;

    const metrics = [];

    const healthStatus =
      metricsSource.health_status ||
      telemetry?.health ||
      telemetry?.status ||
      displayInstance?.status;
    if (healthStatus) {
      metrics.push({
        label: "Health",
        value: formatStatusText(healthStatus),
      });
    }

    const uptime =
      telemetry?.uptime_seconds ??
      telemetry?.uptime ??
      metricsSource.uptime ??
      displayInstance?.uptime_seconds;
    const uptimeFormatted = formatDuration(uptime);
    if (uptimeFormatted) {
      metrics.push({
        label: "Uptime",
        value: uptimeFormatted,
      });
    }

    const cpuMetric =
      telemetry?.cpu_usage ??
      telemetry?.cpu ??
      metricsSource.cpu_usage ??
      metricsSource.cpu;
    if (cpuMetric !== undefined && cpuMetric !== null) {
      const cpuValue =
        typeof cpuMetric === "number"
          ? formatPercentage(cpuMetric)
          : cpuMetric;
      if (cpuValue) {
        metrics.push({
          label: "CPU Usage",
          value: cpuValue,
        });
      }
    }

    const totalMemoryMb = Number(displayInstance?.compute?.memory_mb);
    const memoryUsageRaw =
      telemetry?.memory_used_mb ??
      telemetry?.memory_usage ??
      telemetry?.memory?.used_mb ??
      telemetry?.memory?.usage ??
      metricsSource?.memory_usage;
    const memoryUsage = Number(memoryUsageRaw);
    if (
      Number.isFinite(memoryUsage) &&
      Number.isFinite(totalMemoryMb) &&
      totalMemoryMb > 0
    ) {
      const usedGiB = Math.max(0, Math.round(memoryUsage / 1024));
      const totalGiB = Math.max(0, Math.round(totalMemoryMb / 1024));
      metrics.push({
        label: "Memory",
        value: `${usedGiB} / ${totalGiB} GiB`,
      });
    } else if (typeof memoryUsageRaw === "string") {
      metrics.push({
        label: "Memory",
        value: memoryUsageRaw,
      });
    }

    const networkThroughput =
      telemetry?.network_throughput ??
      telemetry?.network?.throughput ??
      telemetry?.network_transfer_rate ??
      metricsSource?.network_io;
    if (networkThroughput !== undefined && networkThroughput !== null) {
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

      if (displayValue) {
        metrics.push({
          label: "Network",
          value: displayValue,
        });
      }
    }

    const lastHeartbeat =
      telemetry?.last_heartbeat ||
      telemetry?.last_check_in ||
      telemetry?.updated_at ||
      metricsSource?.last_updated;
    if (lastHeartbeat) {
      metrics.push({
        label: "Last heartbeat",
        value: formatDateTime(lastHeartbeat),
      });
    }

    return metrics;
  }, [displayInstance, effectiveMetadata, lifecycleData, monitoringMetrics]);

  const currency =
    pricingBreakdownRaw?.currency || displayInstance?.currency || "NGN";

  const parsedPricingBreakdown = useMemo(() => {
    const pricing = pricingBreakdownRaw;
    if (!pricing || typeof pricing !== "object") {
      return null;
    }

    const linesArray = Array.isArray(pricing.lines) ? pricing.lines : [];

    const normalizedLines = linesArray.map((line, index) => ({
      key: line?.name || `line-${index}`,
      name: line?.name || `Line ${index + 1}`,
      quantity: line?.quantity ?? 1,
      unitAmount:
        line?.unit_amount ??
        line?.unitAmount ??
        line?.unit_price ??
        line?.price ??
        0,
      total: line?.total ?? line?.amount ?? 0,
      frequency: line?.frequency || "recurring",
      currency: line?.currency ?? currency,
    }));

    return {
      lines: normalizedLines,
      subtotal:
        pricing?.subtotal ??
        pricing?.pre_discount_subtotal ??
        pricing?.preDiscountSubtotal ??
        0,
      discount: pricing?.discount ?? 0,
      discountLabel: pricing?.discount_label ?? pricing?.discountLabel,
      tax: pricing?.tax ?? 0,
      total: pricing?.total ?? 0,
      colocationPercentage:
        pricing?.colocation_percentage ??
        pricing?.facility_percentage ??
        null,
      colocationAmount:
        pricing?.colocation_amount ??
        pricing?.facility_amount ??
        null,
    };
  }, [currency, pricingBreakdownRaw]);

  const subscriptionInsights = useMemo(() => {
    if (!displayInstance) return [];

    return [
      {
        label: "Subscription Status",
        value: formatStatusText(displayInstance.status),
      },
      {
        label: "Billing Status",
        value: formatStatusText(displayInstance.billing_status),
      },
      {
        label: "Term Length",
        value: displayInstance.months
          ? `${displayInstance.months} month${
              displayInstance.months > 1 ? "s" : ""
            }`
          : "N/A",
      },
      {
        label: "Next Billing Date",
        value: displayInstance.next_billing_date
          ? formatDate(displayInstance.next_billing_date)
          : "N/A",
      },
      {
        label: "Offer Ends",
        value: displayInstance.offer_ends_at
          ? formatDateTime(displayInstance.offer_ends_at)
          : "N/A",
      },
      {
        label: "Grace Days",
        value:
          displayInstance.grace_days !== undefined &&
          displayInstance.grace_days !== null
            ? `${displayInstance.grace_days}`
            : "N/A",
      },
      {
        label: "Provisioning Driver",
        value: displayInstance.provisioning_driver || "Manual",
      },
      {
        label: "Fast Track",
        value: formatBoolean(displayInstance.fast_track),
      },
      {
        label: "Provisioned At",
        value: displayInstance.provisioned_at
          ? formatDateTime(displayInstance.provisioned_at)
          : "N/A",
      },
      {
        label: "Last Power Event",
        value: displayInstance.last_power_event_at
          ? formatDateTime(displayInstance.last_power_event_at)
          : "N/A",
      },
    ];
  }, [displayInstance]);

  const relatedResources = useMemo(() => {
    if (!displayInstance) return [];

    const resources = [];

    if (displayInstance.project?.name) {
      resources.push({
        key: "project",
        label: "Project",
        value: displayInstance.project.name,
        href: displayInstance.project.id
          ? `/admin-dashboard/projects/${displayInstance.project.id}`
          : null,
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

    if (effectiveMetadata?.security_groups?.length) {
      resources.push({
        key: "security-groups",
        label: "Security Groups",
        chips: effectiveMetadata.security_groups,
        icon: Shield,
      });
    }

    if (effectiveMetadata?.data_volumes?.length) {
      const volumes = effectiveMetadata.data_volumes
        .slice(0, 3)
        .map((vol) => ({
          id: vol?.id || vol?.name || vol?.volume_label,
          name: vol?.name || vol?.volume_label || "Volume",
          size:
            vol?.size_gb ||
            vol?.volume_size_gb ||
            vol?.storage_size_gb ||
            vol?.capacity_gb,
        }));

      resources.push({
        key: "data-volumes",
        label: "Data Volumes",
        volumes,
        extraCount:
          effectiveMetadata.data_volumes.length > volumes.length
            ? effectiveMetadata.data_volumes.length - volumes.length
            : 0,
        icon: HardDrive,
      });
    }

    return resources;
  }, [displayInstance, effectiveMetadata]);

  const enhancedTransactions = useMemo(() => {
    if (!Array.isArray(displayInstance?.transactions)) {
      return [];
    }

    return displayInstance.transactions.map((tx) => {
      const parsedMetadata = safeParseJson(tx.metadata, tx.metadata);
      const parsedPaymentOptions = safeParseJson(
        tx.payment_gateway_options,
        tx.payment_gateway_options
      );

      const paymentOptionsArray = Array.isArray(parsedPaymentOptions)
        ? parsedPaymentOptions
        : parsedPaymentOptions
        ? [parsedPaymentOptions]
        : [];

      const breakdown =
        parsedMetadata?.breakdown ||
        parsedMetadata?.pricing_breakdown ||
        parsedMetadata?.pricingBreakdown ||
        null;

      const breakdownLines = Array.isArray(breakdown?.lines)
        ? breakdown.lines
        : [];

      return {
        ...tx,
        _metadata: parsedMetadata,
        _paymentOptions: paymentOptionsArray,
        _breakdown: breakdown,
        _breakdownLines: breakdownLines,
      };
    });
  }, [displayInstance?.transactions]);

  const toggleMobileMenu = () =>
    setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleGoBack = () => {
    window.location.href = "/admin-dashboard/instances";
  };

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";

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
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${
      displayInstance.identifier || "instance"
    }-details.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
      console.error("Failed to refresh instance status:", error);
      ToastUtils.error(
        error?.message || "Failed to refresh instance status."
      );
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
    async (actionKey) => {
      if (!supportsInstanceActions) {
        ToastUtils.info("Instance actions are not available for this provider.");
        return;
      }
      if (!instanceIdentifier) {
        ToastUtils.error("Unable to determine instance reference.");
        return;
      }

      const actionConfig = availableActions?.[actionKey];
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
        confirmed = window.confirm(confirmationMessage);
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
        await Promise.all([refetchManagement(), refetchLifecycle()]);
      } catch (error) {
        console.error(`Failed to trigger ${actionKey} action`, error);
        ToastUtils.error(
          error?.message ||
            `Unable to trigger ${actionKey} action right now.`
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
      supportsInstanceActions,
    ]
  );

  const handleOpenConsole = useCallback(
    async () => {
      if (!consoleResourceId) {
        ToastUtils.error("Instance reference not available for console access.");
        return;
      }
      try {
        setIsConsoleLoading(true);
        const result = await fetchConsoleUrl();
        if (result?.error) {
          throw result.error;
        }
        const consoleUrl =
          result?.data?.console_url ||
          result?.data?.consoleUrl ||
          result?.console_url ||
          result?.consoleUrl;
        if (!consoleUrl) {
          throw new Error("Console URL unavailable.");
        }
        window.open(consoleUrl, "_blank", "noopener,noreferrer");
      } catch (error) {
        console.error("Unable to launch console", error);
        ToastUtils.error(
          error?.message || "Unable to open console for this instance."
        );
      } finally {
        setIsConsoleLoading(false);
      }
    },
    [consoleResourceId, fetchConsoleUrl]
  );

  const handleMetadataSubmit = useCallback(
    async (event) => {
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
                  .map((tag) => tag.trim())
                  .filter((tag) => tag.length > 0)
              : [],
          },
        });
        ToastUtils.success("Metadata updated successfully");
        await refetchManagement();
      } catch (error) {
        console.error("Failed to update metadata:", error);
        ToastUtils.error(
          error?.message || "Unable to update metadata right now."
        );
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
    const cores = displayInstance?.compute?.vcpus;
    const memoryMb = displayInstance?.compute?.memory_mb;
    const storageGb = displayInstance?.storage_size_gb;
    const totalCost = pricingBreakdownRaw?.total;

    return [
      {
        key: "status",
        title: "Health",
        value:
          telemetrySummary.find((metric) => metric.label === "Health")
            ?.value || formatStatusText(displayInstance.status),
        icon: <Activity size={24} />,
        color: "primary",
        description:
          telemetrySummary.find((metric) => metric.label === "Last heartbeat")
            ?.value || "Monitoring active",
      },
      {
        key: "compute",
        title: "Compute Class",
        value:
          displayInstance?.compute?.productable_name ||
          displayInstance?.compute?.name ||
          "N/A",
        icon: <Server size={24} />,
        color: "info",
        description: cores
          ? `${cores} vCPU • ${
              memoryMb ? `${Math.round(Number(memoryMb) / 1024)} GiB RAM` : "—"
            }`
          : "Compute profile",
      },
      {
        key: "storage",
        title: "Primary Storage",
        value: storageGb
          ? `${storageGb} GiB`
          : "N/A",
        icon: <HardDrive size={24} />,
        color: "info",
        description:
          effectiveMetadata?.storage_type ||
          displayInstance?.volume_type?.name ||
          "Block storage",
      },
      {
        key: "cost",
        title: "Est. Monthly Cost",
        value:
          typeof totalCost === "number"
            ? formatMoney(totalCost, currency)
            : "—",
        icon: <Wallet size={24} />,
        color: "warning",
        description:
          parsedPricingBreakdown?.discount && parsedPricingBreakdown.discount !== 0
            ? `Includes ${formatMoney(parsedPricingBreakdown.discount, currency)} discount`
            : "Pricing snapshot",
      },
    ];
  }, [
    currency,
    displayInstance?.compute?.name,
    displayInstance?.compute?.productable_name,
    displayInstance?.compute?.memory_mb,
    displayInstance?.compute?.vcpus,
    displayInstance?.storage_size_gb,
    displayInstance?.status,
    effectiveMetadata?.storage_type,
    parsedPricingBreakdown?.discount,
    pricingBreakdownRaw?.total,
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
            className={`h-4 w-4 ${
              isConsoleLoading || isConsoleFetching ? "animate-spin" : ""
            }`}
          />
        }
      >
        Open Console
      </ModernButton>
      <ModernButton
        variant="primary"
        size="sm"
        onClick={handleExportJson}
      >
        Export JSON
      </ModernButton>
    </div>
  );

  const isLoadingDetails =
    isManagementFetching && !managementDetails;
  const combinedIsError = isManagementError && !managementDetails;
  const combinedError = managementError;

  if (identifierError) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
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
      </>
    );
  }

  if (isLoadingDetails) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminPageShell
          title="Instance Details"
          description="Review workload telemetry and lifecycle information."
          contentClassName="flex min-h-[60vh] items-center justify-center"
        >
          <ModernCard padding="lg" className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">
              Loading instance details…
            </span>
          </ModernCard>
        </AdminPageShell>
      </>
    );
  }

  if (combinedIsError) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminPageShell
          title="Instance Details"
          description="Review workload telemetry and lifecycle information."
          contentClassName="flex min-h-[60vh] items-center justify-center"
        >
          <ModernCard padding="lg" className="max-w-md space-y-4 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <p className="text-sm text-gray-600">
              {combinedError?.message ||
                "Instance could not be found or is unavailable."}
            </p>
            <ModernButton variant="primary" onClick={handleGoBack}>
              Back to instances
            </ModernButton>
          </ModernCard>
        </AdminPageShell>
      </>
    );
  }

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
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
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_55%)]" />
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
                  Stay informed on lifecycle events, resource utilisation, billing, and provider telemetry for this workload.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {displayInstance.status && (
                  <StatusPill
                    label={formatStatusText(displayInstance.status)}
                    tone={
                      ["running", "active"].includes(
                        (displayInstance.status || "").toLowerCase()
                      )
                        ? "success"
                        : ["stopped", "error", "failed"].includes(
                            (displayInstance.status || "").toLowerCase()
                          )
                        ? "danger"
                        : "info"
                    }
                  />
                )}
                {displayInstance.billing_status && (
                  <StatusPill
                    label={`Billing: ${formatStatusText(
                      displayInstance.billing_status
                    )}`}
                    tone="neutral"
                  />
                )}
                {displayInstance.fulfillment_mode && (
                  <StatusPill
                    label={`${formatStatusText(
                      displayInstance.fulfillment_mode
                    )} fulfillment`}
                    tone="info"
                  />
                )}
              </div>
              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/40 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
                <span className="font-mono">
                  {displayInstance.identifier || "N/A"}
                </span>
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
                    className={`h-4 w-4 ${
                      pendingAction === "refresh" ? "animate-spin" : ""
                    }`}
                  />
                }
                isDisabled={pendingAction === "refresh"}
              >
                Sync status
              </ModernButton>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((stat) => (
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
              <h2 className="text-lg font-semibold text-slate-900">
                Action Centre
              </h2>
              <p className="text-sm text-slate-500">
                Lifecycle controls surface based on provider capabilities and current state.
              </p>
            </div>
            <StatusPill
              label={
                supportsInstanceActions
                  ? "Actions available"
                  : "Actions disabled"
              }
              tone={supportsInstanceActions ? "success" : "warning"}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.keys(ACTION_LIBRARY)
              .filter((actionKey) =>
                actionKey === "refresh"
                  ? true
                  : availableActions?.[actionKey] ||
                    supportsInstanceActions
              )
              .map((actionKey) => {
                const actionConfig =
                  ACTION_LIBRARY[actionKey] || ACTION_LIBRARY.refresh;
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
                    disabled={disabled || actionKey === "refresh" && pendingAction === "refresh"}
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
                    <span className="text-xs">
                      {actionConfig.description}
                    </span>
                  </button>
                );
              })}
          </div>
        </ModernCard>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ModernCard padding="xl" className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Instance Overview
              </h2>
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
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Region
                </p>
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
                  {displayInstance.created_at
                    ? formatDateTime(displayInstance.created_at)
                    : "N/A"}
                </p>
              </div>
            </div>

            {relatedResources.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Related Resources
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {relatedResources.map((resource) => (
                    <div
                      key={resource.key}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        {resource.icon && (
                          <resource.icon className="h-4 w-4 text-slate-400" />
                        )}
                        {resource.label}
                      </div>
                      {resource.value ? (
                        resource.href ? (
                          <a
                            href={resource.href}
                            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#288DD1] transition hover:text-[#1976D2]"
                          >
                            {resource.value}
                            <ArrowLeft className="h-4 w-4 rotate-180" />
                          </a>
                        ) : (
                          <p className="mt-2 text-sm text-slate-700">
                            {resource.value}
                          </p>
                        )
                      ) : null}
                      {resource.copyable && resource.value && (
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(resource.value)
                          }
                          className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-700"
                        >
                          <Copy className="h-3 w-3" />
                          Copy value
                        </button>
                      )}
                      {resource.chips?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {resource.chips.map((chip) => (
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
                          {resource.volumes.map((vol) => (
                            <div
                              key={vol.id || vol.name}
                              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                            >
                              <span className="font-medium text-slate-800">
                                {vol.name}
                              </span>
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
                <h2 className="text-lg font-semibold text-slate-900">
                  Network &amp; Security
                </h2>
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
                        networkTopologySummary.publicIps.map((ip) => (
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
                        networkTopologySummary.privateIps.map((ip) => (
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
                  {securitySummaryEntries.map((entry) => (
                    <div
                      key={entry.label}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {entry.label}
                      </p>
                      {entry.value && (
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {entry.value}
                        </p>
                      )}
                      {entry.chips?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {entry.chips.map((chip) => (
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
                          {entry.volumes.map((vol, index) => (
                            <li
                              className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                              key={`${vol?.id || vol?.name || index}`}
                            >
                              <span className="font-medium text-slate-800">
                                {vol?.name || vol?.volume_label || "Volume"}
                              </span>
                              {vol?.size_gb ? (
                                <span className="ml-2 text-slate-500">
                                  {vol.size_gb} GiB
                                </span>
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
                  <h2 className="text-lg font-semibold text-slate-900">
                    Provider Snapshot
                  </h2>
                  <p className="text-sm text-slate-500">
                    Real-time state synchronised from the underlying infrastructure.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {providerSnapshotEntries.map((entry) => (
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
                            onClick={() =>
                              navigator.clipboard.writeText(entry.value)
                            }
                            className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                            title={`Copy ${entry.label}`}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {entry.value}
                      </p>
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
              <h2 className="text-lg font-semibold text-slate-900">
                Usage &amp; Telemetry
              </h2>
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
                onChange={(event) => setUsagePeriod(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {USAGE_PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {telemetrySummary.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          {isUsageLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-slate-500">
                Loading usage metrics…
              </span>
            </div>
          ) : usageStats ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  label: "CPU Average",
                  value: usageStats.cpu_average
                    ? formatPercentage(usageStats.cpu_average)
                    : "N/A",
                },
                {
                  label: "Memory Average",
                  value: usageStats.memory_average
                    ? `${usageStats.memory_average} MB`
                    : "N/A",
                },
                {
                  label: "Network In",
                  value: usageStats.network_in
                    ? `${usageStats.network_in} MB`
                    : "N/A",
                },
                {
                  label: "Network Out",
                  value: usageStats.network_out
                    ? `${usageStats.network_out} MB`
                    : "N/A",
                },
                {
                  label: "Disk Read",
                  value: usageStats.disk_read
                    ? `${usageStats.disk_read} MB`
                    : "N/A",
                },
                {
                  label: "Disk Write",
                  value: usageStats.disk_write
                    ? `${usageStats.disk_write} MB`
                    : "N/A",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Usage metrics are not available for this instance yet.
            </p>
          )}
          {usageStats?.period ? (
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Reporting window: {usageStats.period}
            </p>
          ) : null}
        </ModernCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <ModernCard padding="xl" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Lifecycle Timeline
                </h2>
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
                lifecycleEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Zap className="h-4 w-4 text-amber-500" />
                        {event.label}
                      </div>
                      <span className="text-xs text-slate-500">
                        {event.timestampLabel}
                      </span>
                    </div>
                    {event.description && (
                      <p className="mt-2 text-sm text-slate-600">
                        {event.description}
                      </p>
                    )}
                    {event.status && (
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        {formatStatusText(event.status)}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No lifecycle events recorded yet.
                </p>
              )}
            </div>
          </ModernCard>

          <ModernCard padding="xl" className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Provider Logs
                </h2>
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
                  onChange={(event) =>
                    setLogLines(Number(event.target.value))
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {LOG_LINE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchLogs()}
                >
                  Refresh
                </ModernButton>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-900/95 p-4 text-xs font-mono text-slate-100">
              {isLogsLoading ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  Loading logs…
                </div>
              ) : Array.isArray(logsData?.logs) && logsData.logs.length ? (
                <pre className="whitespace-pre-wrap break-words text-left">
                  {logsData.logs.join("\n")}
                </pre>
              ) : (
                <span className="text-slate-400">
                  No log lines returned for this interval.
                </span>
              )}
            </div>
          </ModernCard>
        </div>

        <ModernCard padding="xl" className="space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Metadata &amp; Tags
            </h2>
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
            />
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Description
              </label>
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
                    name: managedInstance?.name || "",
                    description: managedInstance?.description || "",
                    tags: Array.isArray(managedInstance?.tags)
                      ? managedInstance.tags.join(", ")
                      : managedInstance?.tags || "",
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
            <h2 className="text-lg font-semibold text-slate-900">
              Pricing Breakdown
            </h2>
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tax
                  </p>
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
              {parsedPricingBreakdown.lines.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-slate-600">
                          Line Item
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-600">
                          Quantity
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-600">
                          Unit Amount
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-slate-600">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedPricingBreakdown.lines.map((line) => (
                        <tr key={line.key}>
                          <td className="px-4 py-2 text-slate-700">
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {line.name}
                              </span>
                              <span className="text-xs text-slate-500">
                                {line.frequency}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-slate-700">
                            {line.quantity}
                          </td>
                          <td className="px-4 py-2 text-slate-700">
                            {formatMoney(line.unitAmount, line.currency)}
                          </td>
                          <td className="px-4 py-2 text-slate-900">
                            {formatMoney(line.total, line.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
            <h2 className="text-lg font-semibold text-slate-900">
              Transactions
            </h2>
            <p className="text-sm text-slate-500">
              Recorded payments and reconciled charges linked to this instance.
            </p>
          </div>
          <div className="overflow-x-auto">
            {enhancedTransactions.length ? (
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-2">Identifier</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Gateway</th>
                    <th className="px-4 py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {enhancedTransactions.map((tx) => {
                    const currencyCode = tx.currency || currency;
                    return (
                      <tr key={tx.id || tx.reference} className="text-slate-700">
                        <td className="px-4 py-3 font-medium">
                          {tx.identifier || tx.reference || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {formatStatusText(tx.transaction_type || tx.type)}
                        </td>
                        <td className="px-4 py-3">
                          {formatMoney(tx.amount, currencyCode)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill
                            label={formatStatusText(tx.status)}
                            tone={
                              tx.status &&
                              ["success", "paid", "completed"].includes(
                                tx.status.toLowerCase()
                              )
                                ? "success"
                                : tx.status &&
                                  ["failed", "refunded"].includes(
                                    tx.status.toLowerCase()
                                  )
                                ? "danger"
                                : "neutral"
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          {tx.payment_gateway || tx.gateway || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {tx.created_at
                            ? formatDateTime(tx.created_at)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-500">
                No billing transactions linked to this instance yet.
              </p>
            )}
          </div>
        </ModernCard>
      </AdminPageShell>
    </>
  );
};

export default AdminInstancesDetails;
