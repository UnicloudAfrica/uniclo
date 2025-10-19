import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Loader2,
  AlertTriangle,
  Copy,
  ArrowLeft,
  ArrowRight,
  Terminal,
  Server,
  Cpu,
  Gauge,
  Timer,
  Play,
  Square,
  RotateCw,
  RefreshCw,
  Activity,
  Network,
  HardDrive,
  Wallet,
  Link,
  Download,
  Globe,
  Shield,
  Layers,
} from "lucide-react";

import { useFetchInstanceRequestById } from "../../hooks/adminHooks/instancesHook";
import {
  useAdminFetchInstanceConsoleById,
  useAdminFetchInstanceLifecycleById,
} from "../../hooks/sharedResourceHooks";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ToastUtils from "../../utils/toastUtil";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleString("en-US", {
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
  if (value === null || value === undefined) return null;
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) return null;

  if (Math.abs(numeric) < 0.01) return "0%";
  return `${Math.abs(numeric) < 10 ? numeric.toFixed(1) : Math.round(numeric)}%`;
};

const Badge = ({ text }) => {
  if (!text) return null;

  const badgeClasses = {
    running: "bg-green-100 text-green-800",
    active: "bg-green-100 text-green-800",
    stopped: "bg-red-100 text-red-700",
    spawning: "bg-blue-100 text-blue-700",
    payment_pending: "bg-orange-100 text-orange-700",
    pending: "bg-yellow-100 text-yellow-700",
    success: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-700",
    default: "bg-gray-100 text-gray-700",
  };

  const tone = badgeClasses[text?.toLowerCase().replace(/\s+/g, "_")] ||
    badgeClasses.default;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${tone}`}>
      {text}
    </span>
  );
};

const DetailRow = ({ label, value, children, isCopyable = false }) => {
  const handleCopy = useCallback(() => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    ToastUtils.success("Copied to clipboard");
  }, [value]);

  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className="mt-1 flex items-start gap-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <span className="flex-1 break-words">
          {hasValue ? value : children || "N/A"}
        </span>
        {isCopyable && value && (
          <button
            onClick={handleCopy}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
            title="Copy value"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
      </dd>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

const Chip = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
    {children}
  </span>
);

export default function AdminInstancesDetails() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [instanceId, setInstanceId] = useState(null);
  const [instanceNameFromUrl, setInstanceNameFromUrl] = useState("");
  const [identifierError, setIdentifierError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [isConsoleLoading, setIsConsoleLoading] = useState(false);

  const { idFromUrl, nameFromUrl } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      idFromUrl: params.get("identifier"),
      nameFromUrl: params.get("name"),
    };
  }, []);

  useEffect(() => {
    setIdentifierError(null);

    if (idFromUrl && idFromUrl.trim()) {
      setInstanceId(idFromUrl.trim());
    } else if (nameFromUrl) {
      try {
        const decoded = atob(decodeURIComponent(nameFromUrl));
        setInstanceId(decoded);
      } catch (error) {
        ToastUtils.error("We could not load that instance. Please try again.");
        setIdentifierError("Invalid instance reference");
        setInstanceId(null);
      }
    } else {
      setIdentifierError("No instance identifier was provided in the URL.");
      setInstanceId(null);
    }

    if (nameFromUrl) {
      setInstanceNameFromUrl(nameFromUrl);
    }
  }, [idFromUrl, nameFromUrl]);

  const {
    data: instanceDetails,
    isFetching,
    isError,
    error,
    refetch: refetchInstanceDetails,
  } = useFetchInstanceRequestById(instanceId);

  const instanceIdentifier = instanceDetails?.identifier || instanceId;
  const consoleResourceId =
    instanceDetails?.id || instanceDetails?.identifier || instanceId;

  const { data: lifecycleData, isLoading: isLifecycleLoading } =
    useAdminFetchInstanceLifecycleById(instanceIdentifier);

  const { refetch: fetchConsoleUrl, isFetching: isConsoleFetching } =
    useAdminFetchInstanceConsoleById(consoleResourceId, {
      enabled: false,
    });

  const consoleLoading = isConsoleLoading || isConsoleFetching;

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const handleCopyIdentifier = useCallback(() => {
    if (!instanceDetails?.identifier) return;
    navigator.clipboard.writeText(instanceDetails.identifier);
    ToastUtils.success("Identifier copied to clipboard");
  }, [instanceDetails?.identifier]);

  const handleCopyShareLink = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    ToastUtils.success("Link copied to clipboard");
  }, [shareUrl]);

  const handleCopyResource = useCallback((value, successMessage) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    ToastUtils.success(successMessage || "Copied to clipboard");
  }, []);

  const handleExportJson = useCallback(() => {
    if (!instanceDetails) return;
    const blob = new Blob([JSON.stringify(instanceDetails, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${instanceDetails.identifier || "instance"}-details.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [instanceDetails]);

  const handleOpenConsole = useCallback(async () => {
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
      const payload = result?.data ?? result;
      const consoleUrl =
        payload?.console_url ||
        payload?.consoleUrl ||
        payload?.url ||
        payload?.data?.console_url ||
        payload?.data?.consoleUrl ||
        payload?.data?.url;

      if (consoleUrl) {
        window.open(consoleUrl, "_blank", "noopener,noreferrer");
        ToastUtils.success("Console opened in a new tab.");
      } else {
        throw new Error("Console URL is not available for this instance.");
      }
    } catch (err) {
      console.error("Failed to open console:", err);
      ToastUtils.error(err?.message || "Unable to open console right now.");
    } finally {
      setIsConsoleLoading(false);
    }
  }, [consoleResourceId, fetchConsoleUrl]);

  const handleInstanceAction = useCallback(
    async (actionKey) => {
      if (!consoleResourceId) {
        ToastUtils.error("Instance reference not available for this action.");
        return;
      }

      setPendingAction(actionKey);
      try {
        ToastUtils.info(
          `${actionKey} action will be wired to the backend in the next update.`
        );
      } catch (err) {
        console.error(`Failed to trigger ${actionKey} action`, err);
        ToastUtils.error(
          err?.message || `Unable to trigger ${actionKey} action right now.`
        );
      } finally {
        setPendingAction(null);
      }
    },
    [consoleResourceId]
  );

  const handleRefreshStatus = useCallback(async () => {
    setPendingAction("refresh");
    try {
      const result = await refetchInstanceDetails();
      if (result?.error) {
        throw result.error;
      }
      if (result?.data) {
        ToastUtils.success("Instance details refreshed");
      }
    } catch (err) {
      console.error("Failed to refresh instance details:", err);
      ToastUtils.error(err?.message || "Failed to refresh instance status.");
    } finally {
      setPendingAction(null);
    }
  }, [refetchInstanceDetails]);

  const handleQuickAction = useCallback(
    (actionKey) => {
      if (actionKey === "refresh") {
        handleRefreshStatus();
        return;
      }

      handleInstanceAction(actionKey);
    },
    [handleInstanceAction, handleRefreshStatus]
  );

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleGoBack = () => {
    window.location.href = "/admin-dashboard/instances";
  };

  const currency =
    instanceDetails?.metadata?.pricing_breakdown?.currency || "NGN";

  const metricCards = useMemo(() => {
    const totalCost =
      instanceDetails?.metadata?.pricing_breakdown?.total;

    return [
      {
        label: "Compute Class",
        value:
          instanceDetails?.compute?.productable_name ||
          instanceDetails?.compute?.name ||
          "N/A",
        icon: Server,
      },
      {
        label: "vCPUs",
        value: instanceDetails?.compute?.vcpus
          ? `${instanceDetails?.compute?.vcpus}`
          : "N/A",
        icon: Cpu,
      },
      {
        label: "Memory",
        value: instanceDetails?.compute?.memory_mb
          ? `${Math.round(Number(instanceDetails?.compute?.memory_mb) / 1024)} GiB`
          : "N/A",
        icon: Gauge,
      },
      {
        label: "Primary Storage",
        value: instanceDetails?.storage_size_gb
          ? `${instanceDetails?.storage_size_gb} GiB`
          : "N/A",
        icon: HardDrive,
      },
      {
        label: "Total Cost",
        value:
          typeof totalCost === "number"
            ? `${currency} ${totalCost.toLocaleString()}`
            : "—",
        icon: Wallet,
      },
    ];
  }, [currency, instanceDetails]);

  const providerVm = useMemo(() => {
    const raw =
      instanceDetails?.metadata?.provider_vm ??
      instanceDetails?.metadata?.provider_vm_snapshot ??
      null;
    return safeParseJson(raw, raw);
  }, [instanceDetails]);

  const providerSnapshot = useMemo(() => {
    if (!providerVm || typeof providerVm !== "object") {
      return null;
    }

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

  const networkTopology = useMemo(() => {
    if (!providerVm || typeof providerVm !== "object") {
      return null;
    }

    return {
      networks: providerVm.addresses || {},
      flatAddresses: providerVm.flat_addresses || [],
      publicIps: providerVm.public_ips || [],
      privateIps: providerVm.private_ips || [],
      primaryIp: providerVm.primary_ip,
    };
  }, [providerVm]);

  const securitySummary = useMemo(() => {
    const metadata = instanceDetails?.metadata || {};
    return {
      keyPair:
        providerVm?.key_name ??
        metadata.key_name ??
        instanceDetails?.key_pair?.name ??
        null,
      securityGroups:
        providerVm?.security_groups ??
        metadata.security_groups ??
        instanceDetails?.security_group_ids ??
        [],
      attachedVolumes: providerVm?.volumes_attached || [],
      createdVolumeIds: metadata?.created_volume_ids || [],
      createdElasticIps: metadata?.created_eip_ids || [],
    };
  }, [instanceDetails, providerVm]);

  const securitySummaryEntries = useMemo(() => {
    if (!securitySummary) return [];

    return [
      {
        label: "Key Pair",
        value: securitySummary.keyPair || "N/A",
      },
      {
        label: "Security Groups",
        value: Array.isArray(securitySummary.securityGroups)
          ? securitySummary.securityGroups.length
            ? null
            : "N/A"
          : "N/A",
        chips: Array.isArray(securitySummary.securityGroups)
          ? securitySummary.securityGroups
          : [],
      },
      {
        label: "Attached Volumes",
        value: Array.isArray(securitySummary.attachedVolumes)
          ? securitySummary.attachedVolumes.length
            ? null
            : "N/A"
          : "N/A",
        volumes: Array.isArray(securitySummary.attachedVolumes)
          ? securitySummary.attachedVolumes
          : [],
      },
      {
        label: "Elastic IPs (Provisioned)",
        value: Array.isArray(securitySummary.createdElasticIps)
          ? securitySummary.createdElasticIps.length
            ? securitySummary.createdElasticIps.join(", ")
            : "None"
          : "None",
      },
      {
        label: "Data Volumes (Provisioned)",
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
      { label: "VM State", value: formatStatusText(providerSnapshot.vmState) },
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

  const hasProviderSnapshot = useMemo(
    () =>
      providerSnapshotEntries.some(
        (entry) => entry.value && entry.value !== "N/A"
      ),
    [providerSnapshotEntries]
  );

  const networkTopologySummary = useMemo(() => {
    if (!networkTopology) return null;

    const networks = Object.entries(networkTopology.networks || {}).map(
      ([name, addresses]) => ({
        name,
        addresses: Array.isArray(addresses) ? addresses : [],
      })
    );

    return {
      networks,
      flatAddresses: Array.isArray(networkTopology.flatAddresses)
        ? networkTopology.flatAddresses
        : [],
      publicIps: Array.isArray(networkTopology.publicIps)
        ? networkTopology.publicIps
        : [],
      privateIps: Array.isArray(networkTopology.privateIps)
        ? networkTopology.privateIps
        : [],
      primaryIp: networkTopology.primaryIp,
    };
  }, [networkTopology]);

  const hasNetworkTopology = useMemo(() => {
    if (!networkTopologySummary) return false;
    return (
      !!networkTopologySummary.primaryIp ||
      networkTopologySummary.publicIps.length > 0 ||
      networkTopologySummary.privateIps.length > 0 ||
      networkTopologySummary.flatAddresses.length > 0 ||
      networkTopologySummary.networks.length > 0
    );
  }, [networkTopologySummary]);

  const lifecycleEvents = useMemo(() => {
    const events = [];

    const rawEvents =
      (Array.isArray(lifecycleData?.events) && lifecycleData.events) ||
      (Array.isArray(lifecycleData?.data?.events) && lifecycleData.data.events) ||
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

    if (!events.length && instanceDetails) {
      const pushFallback = (label, value, description) => {
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

      pushFallback("Instance created", instanceDetails.created_at);
      pushFallback("Lifecycle refreshed", instanceDetails.updated_at);
      pushFallback(
        "Next billing",
        instanceDetails.next_billing_date,
        "Next billing cycle"
      );
      pushFallback("Expires", instanceDetails.expires_at);
    }

    return events.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : Number.NaN;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : Number.NaN;

      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;

      return bTime - aTime;
    });
  }, [instanceDetails, lifecycleData]);

  const telemetrySummary = useMemo(() => {
    if (!instanceDetails) return [];

    const telemetry =
      lifecycleData?.telemetry ||
      lifecycleData?.data?.telemetry ||
      instanceDetails?.metadata?.telemetry ||
      instanceDetails?.telemetry ||
      {};

    const metrics = [];

    const healthStatus =
      instanceDetails?.metadata?.health_status ||
      telemetry?.health ||
      telemetry?.status ||
      instanceDetails?.status;

    if (healthStatus) {
      metrics.push({
        label: "Health",
        value: healthStatus.replace(/_/g, " "),
        tone: healthStatus.toLowerCase(),
      });
    }

    const uptime =
      telemetry?.uptime ||
      telemetry?.uptime_seconds ||
      telemetry?.uptime_secs ||
      instanceDetails?.metadata?.uptime_seconds ||
      instanceDetails?.uptime_seconds;
    const formattedUptime = formatDuration(uptime);
    if (formattedUptime) {
      metrics.push({
        label: "Uptime",
        value: formattedUptime,
      });
    }

    const cpuUsage =
      telemetry?.cpu_usage ??
      telemetry?.cpu_load ??
      telemetry?.cpu?.usage ??
      telemetry?.cpu?.value;
    const cpuValue = formatPercentage(cpuUsage);
    if (cpuValue) {
      metrics.push({
        label: "CPU Usage",
        value: cpuValue,
      });
    }

    const totalMemoryMb = Number(instanceDetails?.compute?.memory_mb);
    const memoryUsageRaw =
      telemetry?.memory_used_mb ??
      telemetry?.memory_usage ??
      telemetry?.memory?.used_mb ??
      telemetry?.memory?.usage;
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
      telemetry?.network_transfer_rate;
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
      telemetry?.updated_at;
    if (lastHeartbeat) {
      metrics.push({
        label: "Last heartbeat",
        value: formatDateTime(lastHeartbeat),
      });
    }

    return metrics;
  }, [instanceDetails, lifecycleData]);

  const parsedPricingBreakdown = useMemo(() => {
    const raw = instanceDetails?.metadata?.pricing_breakdown;
    const pricing = safeParseJson(raw, raw);
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
  }, [instanceDetails, currency]);

  const subscriptionInsights = useMemo(() => {
    if (!instanceDetails) return [];

    return [
      {
        label: "Subscription Status",
        value: formatStatusText(instanceDetails.status),
      },
      {
        label: "Billing Status",
        value: formatStatusText(instanceDetails.billing_status),
      },
      {
        label: "Term Length",
        value: instanceDetails.months
          ? `${instanceDetails.months} month${instanceDetails.months > 1 ? "s" : ""}`
          : "N/A",
      },
      {
        label: "Next Billing Date",
        value: instanceDetails.next_billing_date
          ? formatDate(instanceDetails.next_billing_date)
          : "N/A",
      },
      {
        label: "Offer Ends",
        value: instanceDetails.offer_ends_at
          ? formatDateTime(instanceDetails.offer_ends_at)
          : "N/A",
      },
      {
        label: "Grace Days",
        value:
          instanceDetails.grace_days !== undefined &&
          instanceDetails.grace_days !== null
            ? `${instanceDetails.grace_days}`
            : "N/A",
      },
      {
        label: "Provisioning Driver",
        value: instanceDetails.provisioning_driver || "Manual",
      },
      {
        label: "Fast Track",
        value: formatBoolean(instanceDetails.fast_track),
      },
      {
        label: "Provisioned At",
        value: instanceDetails.provisioned_at
          ? formatDateTime(instanceDetails.provisioned_at)
          : "N/A",
      },
      {
        label: "Last Power Event",
        value: instanceDetails.last_power_event_at
          ? formatDateTime(instanceDetails.last_power_event_at)
          : "N/A",
      },
    ];
  }, [instanceDetails]);

  const relatedResources = useMemo(() => {
    if (!instanceDetails) return [];

    const resources = [];

    if (instanceDetails.project?.name) {
      resources.push({
        key: "project",
        label: "Project",
        value: instanceDetails.project.name,
        href: instanceDetails.project.id
          ? `/admin-dashboard/projects/${instanceDetails.project.id}`
          : null,
        icon: Layers,
      });
    }

    if (instanceDetails.provider || instanceDetails.region) {
      const combined = [instanceDetails.provider, instanceDetails.region]
        .filter(Boolean)
        .join(" · ");

      resources.push({
        key: "provider-region",
        label: "Provider & Region",
        value: combined || "—",
        icon: Globe,
      });
    }

    const floatingIp = instanceDetails.floating_ip?.ip_address;
    const privateIp = instanceDetails.private_ip;
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

    if (instanceDetails.metadata?.security_groups?.length) {
      resources.push({
        key: "security-groups",
        label: "Security Groups",
        chips: instanceDetails.metadata.security_groups,
        icon: Shield,
      });
    }

    if (instanceDetails.metadata?.data_volumes?.length) {
      const volumes = instanceDetails.metadata.data_volumes.slice(0, 3).map(
        (vol) => ({
          id: vol?.id || vol?.name || vol?.volume_label,
          name: vol?.name || vol?.volume_label || "Volume",
          size:
            vol?.size_gb ||
            vol?.volume_size_gb ||
            vol?.storage_size_gb ||
            vol?.capacity_gb,
        })
      );

      resources.push({
        key: "data-volumes",
        label: "Data Volumes",
        volumes,
        extraCount:
          instanceDetails.metadata.data_volumes.length > 3
            ? instanceDetails.metadata.data_volumes.length - 3
            : 0,
        icon: HardDrive,
      });
    }

    if (instanceDetails.tags?.length) {
      resources.push({
        key: "tags",
        label: "Tags",
        chips: instanceDetails.tags,
        icon: Server,
      });
    }

    return resources;
  }, [instanceDetails]);

  const quickActions = useMemo(() => {
    const status = (instanceDetails?.status || "").toLowerCase();

    return [
      {
        key: "start",
        label: "Start Instance",
        description: "Power on and resume workloads",
        icon: Play,
        tone:
          "bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 focus-visible:ring-green-200",
        disabled: ["running", "active", "spawning"].includes(status),
      },
      {
        key: "stop",
        label: "Stop Instance",
        description: "Gracefully shut down the VM",
        icon: Square,
        tone:
          "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 focus-visible:ring-amber-200",
        disabled: !["running", "active"].includes(status),
      },
      {
        key: "reboot",
        label: "Reboot",
        description: "Restart to apply configuration changes",
        icon: RotateCw,
        tone:
          "bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-200",
        disabled: !["running", "active"].includes(status),
      },
      {
        key: "refresh",
        label: "Refresh Status",
        description: "Pull the latest data from the provider",
        icon: RefreshCw,
        tone:
          "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-200",
        disabled: false,
      },
    ];
  }, [instanceDetails?.status]);

  const hasLifecycleEvents = lifecycleEvents.length > 0;
  const hasTelemetry = telemetrySummary.length > 0;
  const hasRelatedResources = relatedResources.length > 0;

  const getTimelineDotClass = (status) => {
    const normalized = status ? String(status).toLowerCase() : "";

    if (["running", "active", "completed", "success"].includes(normalized)) {
      return "bg-green-500 border-green-100";
    }

    if (
      ["pending", "requested", "queued", "provisioning", "creating"].includes(
        normalized
      )
    ) {
      return "bg-blue-500 border-blue-100";
    }

    if (
      ["failed", "error", "terminated", "cancelled", "suspended"].includes(
        normalized
      )
    ) {
      return "bg-red-500 border-red-100";
    }

    return "bg-gray-400 border-gray-200";
  };

  const enhancedTransactions = useMemo(() => {
    if (!Array.isArray(instanceDetails?.transactions)) {
      return [];
    }

    return instanceDetails.transactions.map((tx) => {
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
  }, [instanceDetails?.transactions]);

  if (identifierError) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit flex min-h-full w-full md:w-[calc(100%-5rem)] lg:w-[80%] items-center justify-center bg-[#FAFAFA] p-6 md:p-8">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <p className="mb-4 text-lg font-semibold text-gray-700">
              {identifierError}
            </p>
            <button
              onClick={handleGoBack}
              className="rounded-full bg-[#288DD1] px-6 py-3 font-medium text-white transition-colors hover:bg-[#1976D2]"
            >
              Go back
            </button>
          </div>
        </main>
      </>
    );
  }

  if (isFetching || instanceId === null) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit flex min-h-full w-full md:w-[calc(100%-5rem)] lg:w-[80%] items-center justify-center bg-[#FAFAFA] p-6 md:p-8">
          <div className="text-center">
            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-[#288DD1]" />
            <p className="text-gray-700">Loading instance details…</p>
          </div>
        </main>
      </>
    );
  }

  if (isError || !instanceDetails) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit flex min-h-full w-full md:w-[calc(100%-5rem)] lg:w-[80%] items-center justify-center bg-[#FAFAFA] p-6 md:p-8">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <p className="mb-4 text-lg font-semibold text-gray-700">
              {error || "Instance couldn't be found"}
            </p>
            <button
              onClick={handleGoBack}
              className="rounded-full bg-[#288DD1] px-6 py-3 font-medium text-white transition-colors hover:bg-[#1976D2]"
            >
              Go back
            </button>
          </div>
        </main>
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
      <AdminActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit flex min-h-full w-full md:w-[calc(100%-5rem)] lg:w-[80%] justify-center bg-[#FAFAFA] p-6 md:p-8">
        <div className="w-full max-w-[1300px] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#288DD1] transition-colors hover:text-[#1976D2]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Instances
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Link className="h-4 w-4" />
                Copy Link
              </button>
              <button
                onClick={handleExportJson}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge text={instanceDetails.status?.replace(/_/g, " ") || "Unknown"} />
                  {instanceDetails.billing_status && (
                    <Badge text={`Billing: ${instanceDetails.billing_status.replace(/_/g, " ")}`} />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-gray-900">
                    {instanceDetails.name || instanceNameFromUrl || "Instance"}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-gray-600">
                    {instanceDetails.description ||
                      "Monitor configuration, networking, billing, and lifecycle information for this workload."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip>
                    <span className="font-medium text-gray-700">
                      {instanceDetails.identifier || "N/A"}
                    </span>
                    {instanceDetails.identifier && (
                      <button
                        onClick={handleCopyIdentifier}
                        className="text-gray-400 transition-colors hover:text-gray-600"
                        title="Copy identifier"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </Chip>
                  {instanceDetails.provider && (
                    <Chip>
                      <Server className="h-3.5 w-3.5 text-blue-500" />
                      {instanceDetails.provider}
                    </Chip>
                  )}
                  {instanceDetails.region && (
                    <Chip>
                      <Globe className="h-3.5 w-3.5 text-blue-500" />
                      {instanceDetails.region}
                    </Chip>
                  )}
                  {instanceDetails.months && (
                    <Chip>
                      <Timer className="h-3.5 w-3.5 text-indigo-500" />
                      {instanceDetails.months} month term
                    </Chip>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Lifecycle
                </p>
                <p>Created {formatDate(instanceDetails.created_at)}</p>
                <p>Expires {formatDate(instanceDetails.expires_at)}</p>
                <p>
                  Next billing {formatDate(instanceDetails.next_billing_date)}
                </p>
                <p className="text-xs text-gray-500">
                  Last updated {formatDate(instanceDetails.updated_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metricCards.map((metric) => (
              <MetricCard
                key={metric.label}
                icon={metric.icon}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </div>

          {subscriptionInsights.length ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#575758] mb-4">
                Subscription &amp; Term
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subscriptionInsights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#575758]">
                  Console & Actions
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Launch the remote console or run lifecycle operations for this instance.
                </p>
              </div>
              <button
                onClick={handleOpenConsole}
                disabled={consoleLoading}
                className="inline-flex items-center gap-2 rounded-full bg-[#288DD1] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1976D2] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {consoleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Terminal className="h-4 w-4" />
                )}
                <span>Open Console</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const isLoading = pendingAction === action.key;

                return (
                  <button
                    key={action.key}
                    onClick={() => handleQuickAction(action.key)}
                    disabled={action.disabled || isLoading}
                    className={`group flex items-start gap-3 rounded-2xl px-4 py-3 text-left transition ${action.tone} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-inherit shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {action.label}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {action.description}
                      </span>
                    </span>
                    {isLoading ? (
                      <Loader2 className="mt-1 h-4 w-4 animate-spin text-gray-500" />
                    ) : (
                      <ArrowRight className="mt-1 h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-gray-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#575758]">
                  Lifecycle Timeline
                </h2>
                {isLifecycleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#288DD1]" />
                ) : null}
              </div>
              <div className="mt-4">
                {isLifecycleLoading ? (
                  <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                    Fetching lifecycle events…
                  </div>
                ) : hasLifecycleEvents ? (
                  <ol className="relative border-l border-gray-200 pl-4">
                    {lifecycleEvents.map((event) => (
                      <li key={event.id} className="mb-6 last:mb-0">
                        <span
                          className={`absolute -left-[9px] mt-1 h-3 w-3 rounded-full border-2 ${getTimelineDotClass(
                            event.status
                          )}`}
                        />
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {event.label}
                          </p>
                          {event.description ? (
                            <p className="text-xs text-gray-500">
                              {event.description}
                            </p>
                          ) : null}
                          {event.timestampLabel ? (
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              {event.timestampLabel}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-500">
                    Lifecycle activity will appear here once we record events for this instance.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#575758]">
                    Health & Telemetry
                  </h2>
                  <Activity className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="mt-4 space-y-3">
                  {hasTelemetry ? (
                    telemetrySummary.map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {label}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      We&apos;ll surface telemetry once monitoring data becomes available.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#575758]">
                    Related Resources
                  </h2>
                  <Layers className="h-5 w-5 text-sky-500" />
                </div>
                <div className="mt-4 space-y-4">
                  {hasRelatedResources ? (
                    relatedResources.map((resource) => (
                      <div
                        key={resource.key}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {resource.icon ? (
                              <resource.icon className="h-4 w-4 text-gray-500" />
                            ) : null}
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {resource.label}
                            </span>
                          </div>
                          {resource.copyable && resource.value ? (
                            <button
                              onClick={() =>
                                handleCopyResource(
                                  resource.value,
                                  `${resource.label} copied`
                                )
                              }
                              className="rounded-full p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
                              title={`Copy ${resource.label}`}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>

                        {resource.value ? (
                          resource.href ? (
                            <a
                              href={resource.href}
                              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#288DD1] transition-colors hover:text-[#1976D2]"
                            >
                              {resource.value}
                              <ArrowRight className="h-4 w-4" />
                            </a>
                          ) : (
                            <p className="mt-2 text-sm font-semibold text-gray-900">
                              {resource.value}
                            </p>
                          )
                        ) : null}

                        {resource.chips?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {resource.chips.map((chip) => (
                              <span
                                key={chip}
                                className="inline-flex items-center rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-600"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {resource.volumes?.length ? (
                          <div className="mt-3 space-y-2 text-sm text-gray-600">
                            {resource.volumes.map((vol) => (
                              <div
                                key={vol.id || vol.name}
                                className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                              >
                                <span className="font-medium text-gray-800">
                                  {vol.name}
                                </span>
                                <span className="text-xs uppercase tracking-wide text-gray-500">
                                  {vol.size !== undefined && vol.size !== null
                                    ? typeof vol.size === "string"
                                      ? vol.size
                                      : `${vol.size} GiB`
                                    : "—"}
                                </span>
                              </div>
                            ))}
                            {resource.extraCount ? (
                              <p className="text-xs text-gray-500">
                                +{resource.extraCount} more volume
                                {resource.extraCount > 1 ? "s" : ""}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      Related resources will surface once additional services are linked to this instance.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {hasProviderSnapshot ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#575758] mb-4">
                Provider Snapshot
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {providerSnapshotEntries.map((entry) => (
                  <div
                    key={entry.label}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {entry.label}
                      </p>
                      {entry.copyable && entry.value && entry.value !== "N/A" ? (
                        <button
                          onClick={() =>
                            handleCopyResource(entry.value, `${entry.label} copied`)
                          }
                          className="rounded-full p-1 text-gray-400 transition hover:bg-white hover:text-gray-600"
                          title={`Copy ${entry.label}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {entry.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {hasNetworkTopology ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#575758] mb-4">
                Network Topology
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Primary IP
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {networkTopologySummary.primaryIp || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Public IPs
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {networkTopologySummary.publicIps.length ? (
                        networkTopologySummary.publicIps.map((ip) => (
                          <span
                            key={`public-${ip}`}
                            className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700"
                          >
                            {ip}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-600">None</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Private IPs
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {networkTopologySummary.privateIps.length ? (
                        networkTopologySummary.privateIps.map((ip) => (
                          <span
                            key={`private-${ip}`}
                            className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700"
                          >
                            {ip}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-600">None</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Networks &amp; Interfaces
                  </p>
                  <div className="mt-3 space-y-3 text-sm text-gray-700">
                    {networkTopologySummary.networks.length ? (
                      networkTopologySummary.networks.map((network) => (
                        <div
                          key={network.name}
                          className="rounded-lg border border-gray-200 bg-white p-3"
                        >
                          <p className="text-sm font-semibold text-gray-900">
                            {network.name}
                          </p>
                          <div className="mt-2 space-y-1 text-xs text-gray-600">
                            {network.addresses.length ? (
                              network.addresses.map((addr, idx) => (
                                <div
                                  key={`${network.name}-${idx}-${addr.addr || idx}`}
                                  className="flex flex-wrap items-center gap-2"
                                >
                                  <span className="font-medium text-gray-800">
                                    {addr.addr || "—"}
                                  </span>
                                  {addr["OS-EXT-IPS:type"] || addr.type ? (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                                      {addr["OS-EXT-IPS:type"] || addr.type}
                                    </span>
                                  ) : null}
                                  {addr.version ? (
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                                      IPv{addr.version}
                                    </span>
                                  ) : null}
                                </div>
                              ))
                            ) : (
                              <p>No addresses reported.</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No network details reported by the provider.</p>
                    )}
                  </div>
                </div>
              </div>
              {networkTopologySummary.flatAddresses.length ? (
                <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Normalized Addresses
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {networkTopologySummary.flatAddresses.map((entry, index) => (
                      <div
                        key={`${entry.network}-${entry.addr || index}`}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
                      >
                        <p className="font-semibold text-gray-900">
                          {entry.addr || "—"}
                        </p>
                        <p className="text-[11px] uppercase tracking-wide text-gray-500">
                          {entry.network || "Network"} ·{" "}
                          {entry.type || "private"} · IPv{entry.version || 4}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {hasSecurityDetails ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#575758] mb-4">
                Security &amp; Storage
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {securitySummaryEntries.map((entry) => (
                  <div
                    key={entry.label}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {entry.label}
                    </p>
                    {entry.value ? (
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {entry.value}
                      </p>
                    ) : null}

                    {entry.chips?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entry.chips.map((chip) => {
                          const label =
                            typeof chip === "string"
                              ? chip
                              : chip?.name || chip?.id || "Security Group";
                          return (
                            <span
                              key={label}
                              className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700"
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}

                    {entry.volumes?.length ? (
                      <div className="mt-2 space-y-2 text-xs text-gray-600">
                        {entry.volumes.map((vol, idx) => (
                          <div
                            key={vol?.id || vol?.volumeId || idx}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2"
                          >
                            <p className="font-semibold text-gray-900">
                              {vol?.id || vol?.volumeId || `Volume ${idx + 1}`}
                            </p>
                            <p>
                              Device:{" "}
                              {vol?.device || vol?.mountpoint || vol?.device_name || "—"}
                            </p>
                            {vol?.delete_on_termination !== undefined ? (
                              <p>
                                Delete on termination:{" "}
                                {formatBoolean(vol.delete_on_termination)}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="bg-white rounded-[12px] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#575758] mb-4">
              Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <DetailRow label="Instance Name" value={instanceDetails.name || "N/A"} />
                <DetailRow label="Identifier" value={instanceDetails.identifier} isCopyable />
                <DetailRow
                  label="Status"
                  children={
                    <Badge text={instanceDetails.status?.replace(/_/g, " ")} />
                  }
                />
                <DetailRow label="Provider" value={instanceDetails.provider} />
                <DetailRow label="Region" value={instanceDetails.region} />
                <DetailRow label="Description" value={instanceDetails.description} />
              </div>
              <div>
                <DetailRow label="Project" value={instanceDetails.project?.name || "N/A"} />
                <DetailRow
                  label="Created At"
                  value={new Date(instanceDetails.created_at).toLocaleString()}
                />
                <DetailRow
                  label="Expires At"
                  value={
                    instanceDetails.expires_at
                      ? new Date(instanceDetails.expires_at).toLocaleString()
                      : "N/A"
                  }
                />
                <DetailRow label="Term" value={`${instanceDetails.months} month(s)`} />
                <DetailRow
                  label="Tags"
                  children={
                    <div className="flex flex-wrap gap-2">
                      {instanceDetails.tags && instanceDetails.tags.length > 0 ? (
                        instanceDetails.tags.map((tag, index) => (
                          <Badge key={index} text={tag} />
                        ))
                      ) : (
                        <span>N/A</span>
                      )}
                    </div>
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[12px] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#575758] mb-4">
              Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <DetailRow
                label="Compute Class"
                value={
                  instanceDetails.compute?.productable_name ||
                  instanceDetails.compute?.name ||
                  "N/A"
                }
              />
              <DetailRow
                label="Operating System"
                value={instanceDetails.os_image?.name || "N/A"}
              />
              <DetailRow
                label="Boot Source"
                value={
                  instanceDetails.boot_from_volume ? "Volume" : "Image (Ephemeral)"
                }
              />
              <DetailRow
                label="vCPU"
                value={
                  instanceDetails.compute?.vcpus
                    ? `${instanceDetails.compute?.vcpus} vCPU`
                    : "N/A"
                }
              />
              <DetailRow
                label="Memory"
                value={
                  instanceDetails.compute?.memory_mb
                    ? `${Math.round(Number(instanceDetails.compute?.memory_mb) / 1024)} GiB`
                    : "N/A"
                }
              />
              <DetailRow
                label="Primary Storage"
                value={
                  instanceDetails.storage_size_gb
                    ? `${instanceDetails.storage_size_gb} GiB`
                    : "N/A"
                }
              />
            </div>
          </div>

          <div className="bg-white rounded-[12px] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#575758] mb-4">
              Network & Security
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <DetailRow
                label="Private IP"
                value={instanceDetails.private_ip || "N/A"}
                isCopyable
              />
              <DetailRow
                label="Floating IP"
                value={instanceDetails.floating_ip?.ip_address || "N/A"}
                isCopyable
              />
              <DetailRow
                label="Security Groups"
                children={
                  <div className="flex flex-wrap gap-2">
                    {instanceDetails.metadata?.security_groups?.length ? (
                      instanceDetails.metadata.security_groups.map((sg, idx) => (
                        <Badge key={idx} text={sg} />
                      ))
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                }
              />
              <DetailRow
                label="Bandwidth"
                value={instanceDetails.bandwidth?.name || "N/A"}
              />
            </div>
          </div>

          <div className="bg-white rounded-[12px] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#575758] mb-4">
              Storage & Data Volumes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <DetailRow
                label="Primary Storage"
                value={
                  instanceDetails.storage_size_gb
                    ? `${instanceDetails.storage_size_gb} GiB`
                    : "N/A"
                }
              />
              <DetailRow
                label="Volume Type"
                value={instanceDetails.volume_type?.name || "N/A"}
              />
            </div>
            {instanceDetails.metadata?.data_volumes?.length ? (
              <div className="mt-4 space-y-2">
                {instanceDetails.metadata.data_volumes.map((vol, index) => (
                  <div
                    key={vol?.id || vol?.name || index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"
                  >
                    <p className="font-semibold">
                      {vol?.name || vol?.volume_label || `Volume ${index + 1}`}
                    </p>
                    <p>
                      Size: {vol?.size_gb || vol?.volume_size_gb || vol?.storage_size_gb || "—"} GiB
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="bg-white rounded-[12px] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#575758] mb-4">
              Billing Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <DetailRow label="Currency" value={currency} />
              <DetailRow label="Billing Term" value={`${instanceDetails.months} Months`} />
              <DetailRow
                label="Billing Status"
                children={
                  <Badge text={instanceDetails.billing_status?.replace(/_/g, " ")} />
                }
              />
              {instanceDetails.metadata?.pricing_breakdown?.total && (
                <DetailRow
                  label="Total Cost"
                  value={`${currency} ${instanceDetails.metadata.pricing_breakdown.total.toLocaleString()}`}
                />
              )}
              <DetailRow
                label="Next Billing Date"
                value={
                  instanceDetails.next_billing_date
                    ? new Date(instanceDetails.next_billing_date).toLocaleString()
                    : "N/A"
                }
              />
            </div>
            {parsedPricingBreakdown?.lines?.length ? (
              <div className="mt-6 space-y-3">
                <p className="text-sm font-semibold text-gray-700">
                  Pricing Breakdown
                </p>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-2 text-left">Line Item</th>
                        <th className="px-4 py-2 text-left">Frequency</th>
                        <th className="px-4 py-2 text-left">Quantity</th>
                        <th className="px-4 py-2 text-left">Unit Price</th>
                        <th className="px-4 py-2 text-left">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                      {parsedPricingBreakdown.lines.map((line) => (
                        <tr key={line.key}>
                          <td className="px-4 py-2 font-medium text-gray-900">
                            {line.name}
                          </td>
                          <td className="px-4 py-2 capitalize text-gray-600">
                            {line.frequency?.replace(/_/g, " ") || "Recurring"}
                          </td>
                          <td className="px-4 py-2">{line.quantity}</td>
                          <td className="px-4 py-2">
                            {formatMoney(line.unitAmount, line.currency)}
                          </td>
                          <td className="px-4 py-2 font-semibold text-gray-900">
                            {formatMoney(line.total, line.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Subtotal
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatMoney(parsedPricingBreakdown.subtotal, currency)}
                    </p>
                  </div>
                  {parsedPricingBreakdown.discount ? (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Discount
                      </p>
                      <p className="mt-1 text-sm font-semibold text-red-600">
                        −{formatMoney(parsedPricingBreakdown.discount, currency)}
                      </p>
                      {parsedPricingBreakdown.discountLabel ? (
                        <p className="text-xs text-gray-500">
                          {parsedPricingBreakdown.discountLabel}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {parsedPricingBreakdown.colocationAmount ? (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Facility / Colocation
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {formatMoney(parsedPricingBreakdown.colocationAmount, currency)}
                      </p>
                      {parsedPricingBreakdown.colocationPercentage ? (
                        <p className="text-xs text-gray-500">
                          {parsedPricingBreakdown.colocationPercentage}% applied
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Tax
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatMoney(parsedPricingBreakdown.tax, currency)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:col-span-2 lg:col-span-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Total
                    </p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      {formatMoney(parsedPricingBreakdown.total, currency)}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-white rounded-[12px] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#575758] mb-4">
              Transactions
            </h2>
            <div className="overflow-x-auto">
              {enhancedTransactions.length ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Identifier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gateway
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enhancedTransactions.map((tx, index) => {
                      const currencyCode = tx.currency || currency;
                      const detailItems = [
                        {
                          label: "Reference",
                          value: tx.reference || tx.reference_id,
                        },
                        {
                          label: "Payment Type",
                          value: tx.payment_type || tx.payment_gateway_method,
                        },
                        {
                          label: "Payment Reference",
                          value: tx.payment_reference || tx.client_reference_id,
                        },
                        {
                          label: "Amount Paid",
                          value:
                            tx.amount_paid !== undefined
                              ? formatMoney(tx.amount_paid, currencyCode)
                              : null,
                        },
                        {
                          label: "Transaction Fee",
                          value:
                            tx.transaction_fee !== undefined
                              ? formatMoney(tx.transaction_fee, currencyCode)
                              : null,
                        },
                        {
                          label: "Third-party Fee",
                          value:
                            tx.third_party_fee !== undefined
                              ? formatMoney(tx.third_party_fee, currencyCode)
                              : null,
                        },
                        {
                          label: "Exchange Rate",
                          value:
                            tx.exchange_rate && Number(tx.exchange_rate) !== 0
                              ? Number(tx.exchange_rate).toLocaleString()
                              : null,
                        },
                        {
                          label: "Gateway Message",
                          value: tx.payment_gateway_message,
                        },
                      ].filter((item) => item.value);

                      const hasPaymentOptions = tx._paymentOptions.length > 0;
                      const hasBreakdown = tx._breakdownLines.length > 0;
                      const showDetails =
                        detailItems.length || hasPaymentOptions || hasBreakdown;

                      return (
                        <React.Fragment
                          key={
                            tx.id ||
                            tx.identifier ||
                            tx.reference ||
                            tx.created_at ||
                            index
                          }
                        >
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {tx.identifier || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {tx.type?.replace(/_/g, " ") || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatMoney(tx.amount, currencyCode)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Badge text={tx.status?.replace(/_/g, " ")} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {tx.payment_gateway || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {tx.created_at
                                ? new Date(tx.created_at).toLocaleString()
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {tx.status === "pending" && tx.action === "initiate" ? (
                                <span className="text-[#288DD1]">Pending payment</span>
                              ) : null}
                            </td>
                          </tr>
                          {showDetails ? (
                            <tr className="bg-gray-50">
                              <td colSpan={7} className="px-6 py-4">
                                <div className="grid gap-4 text-sm text-gray-700 lg:grid-cols-2">
                                  {detailItems.length ? (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Transaction Details
                                      </p>
                                      <div className="grid gap-2 rounded-xl border border-gray-100 bg-white p-4">
                                        {detailItems.map((item) => (
                                          <div
                                            key={`${tx.identifier}-${item.label}`}
                                            className="flex items-start justify-between gap-3"
                                          >
                                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                              {item.label}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                              {item.value}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                  {hasPaymentOptions ? (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Payment Instructions
                                      </p>
                                      <div className="space-y-2 rounded-xl border border-gray-100 bg-white p-4">
                                        {tx._paymentOptions.map((option, idx) => (
                                          <div
                                            key={`${tx.identifier}-option-${idx}`}
                                            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                                          >
                                            <p className="font-semibold text-gray-900">
                                              {option?.name || option?.payment_type || "Payment Option"}
                                            </p>
                                            <p className="text-xs uppercase tracking-wide text-gray-500">
                                              {option?.payment_type || option?.type || "Gateway"}
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                              {option?.total
                                                ? formatMoney(option.total, currencyCode)
                                                : ""}
                                            </p>
                                            {option?.transaction_reference ? (
                                              <div className="mt-2 text-xs text-gray-600">
                                                Reference:{" "}
                                                <span className="font-semibold text-gray-900">
                                                  {option.transaction_reference}
                                                </span>
                                              </div>
                                            ) : null}
                                            {option?.details ? (
                                              <div className="mt-2 space-y-1 text-xs text-gray-600">
                                                {Object.entries(option.details).map(
                                                  ([key, value]) => (
                                                    <div key={`${tx.identifier}-${idx}-${key}`}>
                                                      <span className="font-semibold text-gray-900">
                                                        {formatStatusText(key)}
                                                      </span>
                                                      : {value || "—"}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            ) : null}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                                {hasBreakdown ? (
                                  <div className="mt-4 space-y-2 rounded-xl border border-gray-100 bg-white p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                      Charge Breakdown
                                    </p>
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                          <tr>
                                            <th className="px-3 py-2 text-left">Item</th>
                                            <th className="px-3 py-2 text-left">Qty</th>
                                            <th className="px-3 py-2 text-left">Amount</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                                          {tx._breakdownLines.map((line, idx) => (
                                            <tr key={`txn-${tx.id}-line-${idx}`}>
                                              <td className="px-3 py-2 font-medium text-gray-900">
                                                {line?.name || `Line ${idx + 1}`}
                                              </td>
                                              <td className="px-3 py-2">{line?.quantity ?? 1}</td>
                                              <td className="px-3 py-2 font-semibold text-gray-900">
                                                {formatMoney(
                                                  line?.total ?? line?.amount ?? 0,
                                                  line?.currency || currencyCode
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No transactions found for this instance.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
