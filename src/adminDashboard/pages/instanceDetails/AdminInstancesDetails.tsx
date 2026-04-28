import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Wallet,
  Copy,
  Shield,
  Bell,
  BellOff,
  Camera,
  Trash2,
  Plus,
  RotateCcw,
  XCircle,
  Globe2,
  ShieldCheck,
  RefreshCw,
  Activity,
  Zap,
  ArrowUpDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AdminPageShell from "../../components/AdminPageShell";
import { ModernButton, ModernCard } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import {
  useBackupStatus,
  useReplicationStatus,
  useEnableBackup,
  useDisableBackup,
  useTriggerBackup,
  useEnableReplication,
  useDisableReplication,
  useFailover,
} from "@/shared/hooks/resources/integrationHooks";
import type { BackupStatus, ReplicationStatus } from "@/shared/hooks/resources/integrationHooks";
import {
  useFetchInstanceManagementDetails,
  useInstanceManagementAction,
  useRefreshInstanceStatus,
  useInstanceUsageStats,
  useInstanceLogs,
  useUpdateInstanceMetadata,
  useInstanceEvents,
  useInstanceMetrics,
  useInstanceAlarms,
  useInstanceBackupGroups,
  useCreateBackupGroup,
  useDeleteBackupGroup,
  useInstanceSnapshots,
  useTriggerSnapshot,
  useDeleteSnapshot,
  useInstanceRestoreGroups,
  useCreateRestoreGroup,
  useDeleteRestoreGroup,
  useCloseAlarm,
} from "@/shared/hooks/resources/instanceHooks";
import {
  useAdminFetchInstanceConsoleById,
  useAdminFetchInstanceLifecycleById,
} from "@/hooks/sharedResourceHooks";
import InstanceResizeModal from "@/shared/components/instances/InstanceResizeModal";

import type {
  ActionConfig,
  DisplayInstance,
  GenericRecord,
  InstanceTelemetry,
  InstanceUsageStats,
  LifecycleData,
  LifecycleEvent,
  PricingBreakdown,
  PricingLine,
} from "./instanceDetailsTypes";

import {
  buildTelemetryMetrics,
  formatDateTime,
  formatMoney,
  formatStatusText,
  getErrorMessage,
  PROVISIONING_POLL_INTERVAL_MS,
  PROVISIONING_POLL_MAX_ATTEMPTS,
  safeParseJson,
} from "./instanceDetailsUtils";

import InstanceTelemetryCard from "./InstanceTelemetryCard";
import InstancePricingCard, { TransactionsCard } from "./InstancePricingCard";
import { ConsoleLogsViewer } from "./ConsoleLogsViewer";
import InstanceHeroBanner from "./InstanceHeroBanner";
import InstanceMetadataForm from "./InstanceMetadataForm";
import AttachElasticIpModal from "./AttachElasticIpModal";
import {
  useElasticIps,
  useCreateElasticIp,
  useAssociateElasticIp,
  useDisassociateElasticIp,
} from "@/shared/hooks/vpc/elasticIpHooks";
import type { ElasticIp } from "@/shared/components/infrastructure/types";

// ---------------------------------------------------------------------------
// Tab definitions — Zadara-style
// ---------------------------------------------------------------------------

const TAB_IDS = ["overview", "events", "volumes", "networks", "monitoring", "protection", "alarms", "billing"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  events: "Events",
  volumes: "Volumes",
  networks: "Networks",
  monitoring: "Monitoring",
  protection: "Protection",
  alarms: "Alarms",
  billing: "Billing",
};

// ---------------------------------------------------------------------------
// Simple key-value row for Overview table
// ---------------------------------------------------------------------------

const InfoRow: React.FC<{ label: string; value: React.ReactNode; copyable?: string }> = ({
  label,
  value,
  copyable,
}) => (
  <tr className="border-b border-slate-100 last:border-b-0">
    <td className="whitespace-nowrap py-2.5 pr-8 text-sm text-slate-500">{label}</td>
    <td className="py-2.5 text-sm font-medium text-slate-900">
      <span className="flex items-center gap-2">
        {value || "—"}
        {copyable && (
          <button
            onClick={() => navigator.clipboard.writeText(copyable)}
            className="rounded p-0.5 text-slate-400 hover:text-slate-600"
            title={`Copy ${label}`}
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </span>
    </td>
  </tr>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const AdminInstancesDetails = () => {
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [usagePeriod, setUsagePeriod] = useState("24h");
  const [logLines, setLogLines] = useState(200);
  const [metadataForm, setMetadataForm] = useState({
    name: "",
    description: "",
    tags: "",
  });
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isConsoleLoading, setIsConsoleLoading] = useState(false);
  const [_isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [showAttachEipModal, setShowAttachEipModal] = useState(false);
  const [showResizeModal, setShowResizeModal] = useState(false);
  const provisioningPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const provisioningPollAttemptsRef = useRef(0);
  const provisioningPollTokenRef = useRef(0);
  const provisioningPollErrorsRef = useRef(0);

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
    isLoading: _isLifecycleLoading,
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

  // Provider events, metrics, alarms
  const { data: providerEventsRaw } = useInstanceEvents(
    instanceIdentifier ?? "",
    { limit: 100 },
    { enabled: !!instanceIdentifier }
  );
  const providerEvents = (providerEventsRaw as GenericRecord | null) ?? null;

  const { data: providerAlarmsRaw } = useInstanceAlarms(
    instanceIdentifier ?? "",
    {},
    { enabled: !!instanceIdentifier }
  );
  const providerAlarms = (providerAlarmsRaw as GenericRecord | null) ?? null;

  // Metrics time-series for charts
  const [metricsRange, setMetricsRange] = useState<"1h" | "6h" | "24h" | "7d">("1h");
  const metricsTimestamps = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const rangeSeconds: Record<string, number> = { "1h": 3600, "6h": 21600, "24h": 86400, "7d": 604800 };
    return { start: now - (rangeSeconds[metricsRange] || 3600), end: now };
  }, [metricsRange]);

  const { data: cpuMetricsRaw, isFetching: isCpuMetricsFetching } = useInstanceMetrics(
    instanceIdentifier ?? "",
    { metric: "cpu", start_timestamp: metricsTimestamps.start, end_timestamp: metricsTimestamps.end, statistic: "mean", interval: metricsRange === "7d" ? 60 : metricsRange === "24h" ? 15 : 5 },
    { enabled: !!instanceIdentifier && activeTab === "monitoring" }
  );
  const { data: memMetricsRaw, isFetching: isMemMetricsFetching } = useInstanceMetrics(
    instanceIdentifier ?? "",
    { metric: "memory", start_timestamp: metricsTimestamps.start, end_timestamp: metricsTimestamps.end, statistic: "mean", interval: metricsRange === "7d" ? 60 : metricsRange === "24h" ? 15 : 5 },
    { enabled: !!instanceIdentifier && activeTab === "monitoring" }
  );
  const { data: netMetricsRaw, isFetching: isNetMetricsFetching } = useInstanceMetrics(
    instanceIdentifier ?? "",
    { metric: "network", start_timestamp: metricsTimestamps.start, end_timestamp: metricsTimestamps.end, statistic: "mean", interval: metricsRange === "7d" ? 60 : metricsRange === "24h" ? 15 : 5 },
    { enabled: !!instanceIdentifier && activeTab === "monitoring" }
  );

  // Protection hooks
  const { data: backupGroupsRaw, isFetching: isBackupGroupsFetching, refetch: refetchBackupGroups } =
    useInstanceBackupGroups(instanceIdentifier ?? "", { enabled: !!instanceIdentifier && activeTab === "protection" });
  const { data: snapshotsRaw, isFetching: isSnapshotsFetching, refetch: refetchSnapshots } =
    useInstanceSnapshots(instanceIdentifier ?? "", {}, { enabled: !!instanceIdentifier && activeTab === "protection" });
  const { data: restoreGroupsRaw, isFetching: isRestoreGroupsFetching, refetch: refetchRestoreGroups } =
    useInstanceRestoreGroups(instanceIdentifier ?? "", { enabled: !!instanceIdentifier && activeTab === "protection" });

  const { mutateAsync: createBackupGroupMutation } = useCreateBackupGroup();
  const { mutateAsync: deleteBackupGroupMutation } = useDeleteBackupGroup();
  const { mutateAsync: triggerSnapshotMutation } = useTriggerSnapshot();
  const { mutateAsync: deleteSnapshotMutation } = useDeleteSnapshot();
  const { mutateAsync: _createRestoreGroupMutation } = useCreateRestoreGroup();
  const { mutateAsync: deleteRestoreGroupMutation } = useDeleteRestoreGroup();
  const { mutateAsync: closeAlarmMutation } = useCloseAlarm();

  const [showCreateBackupForm, setShowCreateBackupForm] = useState(false);
  const [backupFormName, setBackupFormName] = useState("");

  // Integration protection hooks (AnyCloudFlow backup & replication)
  const instanceDbId = (displayInstance?.id ?? managedInstance?.["id"]) as string | number | undefined;
  const { data: acfBackupStatusRaw } = useBackupStatus(
    "anycloudflow", "instance", instanceDbId,
    { enabled: !!instanceDbId && activeTab === "protection" },
  );
  const { data: acfReplicationStatusRaw } = useReplicationStatus(
    "anycloudflow", "instance", instanceDbId,
    { enabled: !!instanceDbId && activeTab === "protection" },
  );
  const acfBackupStatus = acfBackupStatusRaw as BackupStatus | undefined;
  const acfReplicationStatus = acfReplicationStatusRaw as ReplicationStatus | undefined;
  const enableBackupMutation = useEnableBackup();
  const disableBackupMutation = useDisableBackup();
  const triggerBackupMutation = useTriggerBackup();
  const enableReplicationMutation = useEnableReplication();
  const disableReplicationMutation = useDisableReplication();
  const failoverMutation = useFailover();

  const { mutateAsync: updateMetadataMutation, isPending: isMetadataUpdating } =
    useUpdateInstanceMetadata();

  // Elastic IP mutation hooks (queries added after providerVm is defined below)
  const projectId = displayInstance?.project?.id || displayInstance?.project?.identifier || "";
  const { mutateAsync: createElasticIpMutation, isPending: isAllocatingEip } = useCreateElasticIp();
  const { mutateAsync: associateElasticIpMutation, isPending: isAssociatingEip } = useAssociateElasticIp();
  const { mutateAsync: disassociateElasticIpMutation, isPending: isDisassociatingEip } = useDisassociateElasticIp();

  // ---------------------------------------------------------------------------
  // Provisioning polling
  // ---------------------------------------------------------------------------

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
    provisioningPollErrorsRef.current = 0;
    const pollToken = provisioningPollTokenRef.current + 1;
    provisioningPollTokenRef.current = pollToken;
    setIsAutoSyncing(true);

    const poll = async () => {
      if (provisioningPollTokenRef.current !== pollToken) return;
      if (!instanceIdentifier) {
        stopProvisioningPoll();
        return;
      }

      provisioningPollAttemptsRef.current += 1;
      let nextStatus: string | null = null;

      try {
        await refreshStatusMutation(instanceIdentifier);
        const refreshed = await refetchManagement();
        await refetchLifecycle();
        const refreshedData = (refreshed as unknown as GenericRecord | undefined)?.["data"] as
          | GenericRecord
          | undefined;
        const instance = refreshedData?.["instance"] as GenericRecord | undefined;
        nextStatus = String(instance?.["status"] || "").toLowerCase();
        provisioningPollErrorsRef.current = 0;
      } catch {
        provisioningPollErrorsRef.current += 1;
        if (provisioningPollErrorsRef.current >= 3) {
          stopProvisioningPoll();
          return;
        }
      }

      if (provisioningPollTokenRef.current !== pollToken) return;

      if (nextStatus && ["failed", "error", "terminated", "deleted", "active"].includes(nextStatus)) {
        stopProvisioningPoll();
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

  // ---------------------------------------------------------------------------
  // Computed data
  // ---------------------------------------------------------------------------

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
    if (!pricing || typeof pricing !== "object") return null;

    const linesArray = Array.isArray(pricing["lines"]) ? (pricing["lines"] as PricingLine[]) : [];
    const normalizedLines = linesArray.map((line: PricingLine, index: number) => ({
      key: line?.["name"] || `line-${index}`,
      name: line?.["name"] || `Line ${index + 1}`,
      quantity: Number(line?.["quantity"] ?? 1),
      unitAmount: Number(
        line?.["unit_amount"] ?? line?.["unitAmount"] ?? line?.["unit_price"] ?? line?.["price"] ?? 0
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
      subtotal: Number(pricing?.["subtotal"] ?? pricing?.["pre_discount_subtotal"] ?? 0),
      discount: Number(pricing?.["discount"] ?? 0),
      discountLabel: (pricing?.["discount_label"] ?? pricing?.["discountLabel"]) as string | undefined,
      tax: Number(pricing?.["tax"] ?? 0),
      total: Number(pricing?.["total"] ?? 0),
      colocationPercentage: colocationPercentageRaw === null ? null : Number(colocationPercentageRaw),
      colocationAmount: colocationAmountRaw === null ? null : Number(colocationAmountRaw),
    } as PricingBreakdown;
  }, [currency, pricingBreakdownRaw]);

  const enhancedTransactions = useMemo(() => {
    if (!Array.isArray(displayInstance?.transactions)) return [];
    return displayInstance.transactions.map((tx: GenericRecord) => {
      const metadataStr = tx["metadata"] as string | undefined;
      const parsedMetadata = (safeParseJson(metadataStr, metadataStr) as GenericRecord | null) || {};
      const gatewayOptionsStr = tx["payment_gateway_options"] as string | undefined;
      const parsedPaymentOptions = safeParseJson(gatewayOptionsStr, gatewayOptionsStr);
      const paymentOptionsArray = Array.isArray(parsedPaymentOptions)
        ? (parsedPaymentOptions as unknown[])
        : parsedPaymentOptions
          ? [parsedPaymentOptions as unknown]
          : [];
      const breakdown = (parsedMetadata?.["breakdown"] ||
        parsedMetadata?.["pricing_breakdown"] ||
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

  // ---------------------------------------------------------------------------
  // Computed props for header
  // ---------------------------------------------------------------------------

  const computeProps = useMemo(() => {
    const cp = (displayInstance?.["compute"] || displayInstance?.["compute_details"]) as
      | GenericRecord
      | undefined;
    const vcpusRaw = cp?.["vcpus"] || cp?.["v_cpus"] || cp?.["cores"];
    const memoryMbRaw = cp?.["memory_mb"] || cp?.["memory_mbi"] || cp?.["ram"] || cp?.["memory"];
    return {
      name: (cp?.["productable_name"] || cp?.["name"]) as string | undefined,
      vcpus: vcpusRaw ? Number(vcpusRaw) : 0,
      memoryGb: memoryMbRaw ? Math.round(Number(memoryMbRaw) / 1024) : 0,
    };
  }, [displayInstance]);

  const storageGb = useMemo(() => {
    const raw =
      effectiveMetadata?.["storage_gb"] ||
      effectiveMetadata?.["disk_gb"] ||
      displayInstance?.["storage_gb"] ||
      displayInstance?.["storage_size_gb"];
    return raw ? Number(raw) : 0;
  }, [effectiveMetadata, displayInstance]);

  const totalCost = Number(pricingBreakdownRaw?.["total"] || 0);

  // Provider VM snapshot
  const providerVm = useMemo<GenericRecord | null>(() => {
    if (providerDetails && typeof providerDetails === "object") {
      return providerDetails as GenericRecord;
    }
    const raw = effectiveMetadata?.["provider_vm"] ?? effectiveMetadata?.["provider_vm_snapshot"] ?? null;
    return (safeParseJson(raw, raw) as GenericRecord | null) || null;
  }, [effectiveMetadata, providerDetails]);

  // ---------------------------------------------------------------------------
  // Elastic IP queries (must be after providerVm)
  // ---------------------------------------------------------------------------
  const providerVmId = (providerVm?.["provider_vm_id"] || providerVm?.["id"]) as string | undefined;

  const {
    data: elasticIps = [],
    isLoading: isEipsLoading,
    refetch: refetchElasticIps,
  } = useElasticIps(projectId, "", {
    enabled: !!projectId,
  });

  const availableElasticIps = useMemo(
    () => (elasticIps as ElasticIp[]).filter((eip) => !eip.association_id),
    [elasticIps]
  );

  const instanceElasticIps = useMemo(
    () => (elasticIps as ElasticIp[]).filter((eip) => eip.instance_id === providerVmId),
    [elasticIps, providerVmId]
  );

  const eipByNic = useMemo(() => {
    const map = new Map<string, ElasticIp>();
    instanceElasticIps.forEach((eip) => {
      if (eip.network_interface_id) map.set(eip.network_interface_id, eip);
    });
    return map;
  }, [instanceElasticIps]);

  const handleAllocateElasticIp = async () => {
    try {
      await createElasticIpMutation({ projectId });
      refetchElasticIps();
    } catch { /* hook shows toast */ }
  };

  const handleAssociateElasticIp = async (elasticIpId: string, networkInterfaceId: string) => {
    try {
      await associateElasticIpMutation({
        projectId,
        elasticIpId,
        payload: { instance_id: providerVmId, network_interface_id: networkInterfaceId },
      });
      setShowAttachEipModal(false);
      refetchElasticIps();
      refetchManagement();
    } catch { /* hook shows toast */ }
  };

  const handleDisassociateElasticIp = async (elasticIpId: string) => {
    try {
      await disassociateElasticIpMutation({ projectId, elasticIpId });
      refetchElasticIps();
      refetchManagement();
    } catch { /* hook shows toast */ }
  };

  // Network topology
  const networkTopology = useMemo(() => {
    if (networkInfo && typeof networkInfo === "object") {
      const info = networkInfo as GenericRecord;
      return {
        networks: info["networks"] as unknown[] | undefined,
        flatAddresses: (info["flat_addresses"] || info["flatAddresses"] || []) as unknown[],
        publicIps: (info["public_ips"] || info["publicIps"] || []) as string[],
        privateIps: (info["private_ips"] || info["privateIps"] || []) as string[],
        primaryIp: (info["primary_ip"] || info["primaryIp"]) as string | undefined,
      };
    }
    if (!providerVm || typeof providerVm !== "object") return null;
    const vm = providerVm as GenericRecord;
    return {
      networks: undefined,
      flatAddresses: (vm["flat_addresses"] as unknown[]) || [],
      publicIps: (vm["public_ips"] as string[]) || [],
      privateIps: (vm["private_ips"] as string[]) || [],
      primaryIp: vm["primary_ip"] as string | undefined,
    };
  }, [networkInfo, providerVm]);

  // Security summary
  const securitySummary = useMemo(() => {
    if (securityInfo && typeof securityInfo === "object") {
      return {
        keyPair: securityInfo["key_pair"] || securityInfo["keyPair"] || null,
        securityGroups: securityInfo["security_groups"] || securityInfo["securityGroups"] || [],
        attachedVolumes: securityInfo["volumes"] || securityInfo["volumes_attached"] || [],
      };
    }
    const vm = providerVm as GenericRecord | null;
    return {
      keyPair:
        (vm?.["key_name"] as string | undefined) ??
        (effectiveMetadata?.["key_name"] as string | undefined) ??
        ((displayInstance?.["key_pair"] as GenericRecord | undefined)?.["name"] as string | undefined) ??
        null,
      securityGroups:
        (vm?.["security_groups"] as unknown[]) ??
        (effectiveMetadata?.["security_groups"] as unknown[]) ??
        (displayInstance?.["security_group_ids"] as string[] | undefined) ??
        [],
      attachedVolumes: (vm?.["volumes_attached"] as unknown[]) || [],
    };
  }, [displayInstance, effectiveMetadata, providerVm, securityInfo]);

  // Telemetry for header activity display
  const activityMetrics = useMemo(() => {
    const cpuEntry = telemetrySummary.find((m) => m.label === "CPU Usage");
    const memEntry = telemetrySummary.find((m) => m.label === "Memory");
    const netEntry = telemetrySummary.find((m) => m.label === "Network");
    return {
      cpuUsage: cpuEntry?.value || null,
      memoryUsage: memEntry?.value || null,
      networkRx: netEntry?.value || null,
      networkTx: null,
    };
  }, [telemetrySummary]);

  // Tags
  const tags = useMemo(() => {
    if (Array.isArray(displayInstance?.tags)) return displayInstance.tags;
    if (typeof displayInstance?.tags === "string" && displayInstance.tags) {
      return displayInstance.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }
    return [];
  }, [displayInstance?.tags]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleGoBack = () => {
    if (globalThis.history.length > 1) {
      globalThis.history.back();
    } else {
      globalThis.window.location.href = "/admin-dashboard/cube-instances";
    }
  };

  const handleCopyIdentifier = useCallback(() => {
    if (!displayInstance?.identifier) return;
    navigator.clipboard.writeText(displayInstance.identifier);
    ToastUtils.success("Identifier copied to clipboard");
  }, [displayInstance?.identifier]);

  const _handleExportJson = useCallback(() => {
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
      await Promise.all([refetchManagement(), refetchLifecycle()]);
    } catch (error) {
      ToastUtils.error(getErrorMessage(error, "Failed to refresh instance status."));
    } finally {
      setPendingAction(null);
    }
  }, [instanceIdentifier, isRefreshingStatus, refreshStatusMutation, refetchManagement, refetchLifecycle]);

  const handleInstanceAction = useCallback(
    async (actionKey: string) => {
      if (actionKey === "resize") {
        setShowResizeModal(true);
        return;
      }
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
        } as { identifier: typeof instanceIdentifier });
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
      const result = (fetchResult.data as unknown as GenericRecord | undefined) || {};
      if (fetchResult.isError) throw fetchResult.error;
      const resultData = (result["data"] as GenericRecord | undefined) || result;
      const consoleUrl =
        (resultData?.["url"] as string | undefined) ||
        (resultData?.["console_url"] as string | undefined) ||
        (result?.["console_url"] as string | undefined);
      if (!consoleUrl) throw new Error("Console URL unavailable.");
      const win = globalThis.open(consoleUrl, "_blank", "noopener,noreferrer");
      if (!win) {
        ToastUtils.error("Popup blocked by your browser. Please allow popups for this site.");
        return;
      }
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
              ? metadataForm.tags.split(",").map((t: string) => t.trim()).filter((t: string) => t.length > 0)
              : [],
          },
        });
        ToastUtils.success("Metadata updated successfully");
        await refetchManagement();
      } catch (error) {
        ToastUtils.error(getErrorMessage(error, "Unable to update metadata right now."));
      }
    },
    [instanceIdentifier, metadataForm, refetchManagement, updateMetadataMutation]
  );

  // ---------------------------------------------------------------------------
  // Early returns
  // ---------------------------------------------------------------------------

  const isLoadingDetails = isManagementFetching && !managementDetails;
  const combinedIsError = isManagementError && !managementDetails;
  const combinedError = managementError;

  if (identifierError) {
    return (
      <AdminPageShell title="Instance Details" contentClassName="flex min-h-[60vh] items-center justify-center">
        <ModernCard padding="lg" className="max-w-md space-y-4 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="text-sm text-gray-600">{identifierError}</p>
          <ModernButton variant="primary" onClick={handleGoBack}>Back to instances</ModernButton>
        </ModernCard>
      </AdminPageShell>
    );
  }

  if (isLoadingDetails) {
    return (
      <AdminPageShell title="Instance Details" contentClassName="flex min-h-[60vh] items-center justify-center">
        <ModernCard padding="lg" className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-sm text-gray-600">Loading instance details...</span>
        </ModernCard>
      </AdminPageShell>
    );
  }

  if (combinedIsError) {
    return (
      <AdminPageShell title="Instance Details" contentClassName="flex min-h-[60vh] items-center justify-center">
        <ModernCard padding="lg" className="max-w-md space-y-4 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="text-sm text-gray-600">
            {combinedError?.message || "Instance could not be found or is unavailable."}
          </p>
          <ModernButton variant="primary" onClick={handleGoBack}>Back to instances</ModernButton>
        </ModernCard>
      </AdminPageShell>
    );
  }

  // ---------------------------------------------------------------------------
  // Tab content renderers
  // ---------------------------------------------------------------------------

  /** Overview — Zadara-style key-value table */
  const renderOverviewTab = () => {
    const instanceTypeVal = computeProps.name || (effectiveMetadata?.["instance_type"] as string);
    const osImage = displayInstance.os_image?.name || (effectiveMetadata?.["os_image"] as string);
    const firmwareType = (providerVm?.["firmware_type"] || effectiveMetadata?.["firmware_type"]) as string | undefined;
    const bootVolume = (providerVm?.["boot_volume"] || effectiveMetadata?.["boot_volume_id"]) as string | undefined;
    const keyPair = securitySummary.keyPair;
    const account = (effectiveMetadata?.["account"] || providerVm?.["tenant_id"]) as string | undefined;
    const protection = (providerVm?.["protection"] || effectiveMetadata?.["protection"]) as string | undefined;
    const profile = (effectiveMetadata?.["profile"] || providerVm?.["profile"]) as string | undefined;
    const highAvailability = providerVm?.["high_availability"] as boolean | undefined;
    const vncAccess = providerVm?.["vnc_admin_access"] as boolean | undefined;

    return (
      <div className="overflow-x-auto">
        <table className="w-full max-w-xl">
          <tbody>
            <InfoRow label="Name" value={displayInstance.name || displayInstance.identifier} />
            {instanceTypeVal && <InfoRow label="Instance Type" value={instanceTypeVal} />}
            {osImage && (
              <InfoRow
                label="Image"
                value={<span className="text-blue-600">{osImage}</span>}
              />
            )}
            {displayInstance.os_image?.name && (
              <InfoRow label="Operating System" value={displayInstance.os_image.name} />
            )}
            <InfoRow label="vCPUs" value={computeProps.vcpus > 0 ? String(computeProps.vcpus) : undefined} />
            <InfoRow label="RAM" value={computeProps.memoryGb > 0 ? `${computeProps.memoryGb} GiB` : undefined} />
            <InfoRow label="Disk" value={storageGb > 0 ? `${storageGb} GiB` : undefined} />
            {firmwareType && <InfoRow label="Firmware Type" value={firmwareType} />}
            {bootVolume && (
              <InfoRow
                label="Boot Volume"
                value={<span className="text-blue-600">{bootVolume}</span>}
              />
            )}
            <InfoRow label="Instance Profile" value={profile || "None"} />
            {providerVm?.["host"] && <InfoRow label="Node" value={<span className="text-blue-600">{providerVm["host"] as string}</span>} />}
            {account && <InfoRow label="Account" value={account} />}
            {displayInstance.project?.name && <InfoRow label="Project" value={displayInstance.project.name} />}
            {protection !== undefined && <InfoRow label="Protection" value={protection || "Unprotected"} />}
            {highAvailability !== undefined && (
              <InfoRow
                label="High Availability"
                value={
                  <span className={`inline-block h-5 w-9 rounded-full ${highAvailability ? "bg-blue-500" : "bg-slate-300"}`}>
                    <span className={`mt-0.5 block h-4 w-4 rounded-full bg-white shadow transition-transform ${highAvailability ? "translate-x-4" : "translate-x-0.5"}`} />
                  </span>
                }
              />
            )}
            {vncAccess !== undefined && (
              <InfoRow
                label="VNC Admin Access"
                value={
                  <span className={`inline-block h-5 w-9 rounded-full ${vncAccess ? "bg-blue-500" : "bg-slate-300"}`}>
                    <span className={`mt-0.5 block h-4 w-4 rounded-full bg-white shadow transition-transform ${vncAccess ? "translate-x-4" : "translate-x-0.5"}`} />
                  </span>
                }
              />
            )}
            {typeof keyPair === "string" && <InfoRow label="Key Pair" value={keyPair || "—"} />}
            {(providerVm?.["id"] || providerVm?.["provider_vm_id"]) && (
              <InfoRow
                label="ID"
                value={
                  <span className="font-mono text-xs">
                    {(providerVm["provider_vm_id"] || providerVm["id"]) as string}
                  </span>
                }
                copyable={(providerVm["provider_vm_id"] || providerVm["id"]) as string}
              />
            )}
            <InfoRow label="Region" value={displayInstance.region} />
            {displayInstance.created_at && <InfoRow label="Created" value={formatDateTime(displayInstance.created_at)} />}
            {displayInstance.status && <InfoRow label="Status" value={formatStatusText(displayInstance.status)} />}
            {displayInstance.billing_status && <InfoRow label="Billing Status" value={formatStatusText(displayInstance.billing_status)} />}
            {displayInstance.fulfillment_mode && <InfoRow label="Fulfillment" value={formatStatusText(displayInstance.fulfillment_mode)} />}
          </tbody>
        </table>
      </div>
    );
  };

  /** Events — merged lifecycle + provider events */
  const renderEventsTab = () => {
    // Merge provider events with lifecycle events
    const providerEventsList: LifecycleEvent[] = (() => {
      const raw = providerEvents?.["events"] || providerEvents?.["data"] || [];
      if (!Array.isArray(raw)) return [];
      return raw.map((e: GenericRecord, i: number) => ({
        id: String(e["event_id"] || e["id"] || `provider-${i}`),
        label: String(e["event_type"] || e["name"] || e["type"] || `Event ${i + 1}`),
        timestamp: (e["timestamp"] || e["created_at"] || e["occurred_at"]) as string | number | null,
        timestampLabel: formatDateTime(e["timestamp"] || e["created_at"] || e["occurred_at"]),
        status: String(e["severity"] || e["status"] || "info"),
        description: String(e["description"] || e["message"] || e["details"] || ""),
        source: "provider" as const,
      }));
    })();

    const allEvents = [...lifecycleEvents, ...providerEventsList].sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp as string).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp as string).getTime() : 0;
      return tb - ta; // newest first
    });

    // Alarms section
    const alarmsList = Array.isArray(providerAlarms?.["alarms"]) ? providerAlarms!["alarms"] as GenericRecord[] : [];

    return (
      <div className="space-y-6">
        {/* Active alarms banner */}
        {alarmsList.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-amber-800">
              Active Alarms ({alarmsList.length})
            </h4>
            <div className="space-y-1">
              {alarmsList.slice(0, 5).map((alarm: GenericRecord, i: number) => (
                <div key={String(alarm["alarm_id"] || i)} className="flex items-center justify-between text-xs">
                  <span className="text-amber-900">
                    {String(alarm["alarm_type"] || alarm["name"] || alarm["type"] || `Alarm ${i + 1}`)}
                  </span>
                  <span className="text-amber-600">
                    {formatDateTime(alarm["created_at"] || alarm["timestamp"])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event count */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{allEvents.length} Items</span>
        </div>

        {allEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-4">Severity</th>
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {allEvents.map((event) => {
                  const severity = (event.status || "info").toLowerCase();
                  const isError = ["error", "failed", "terminated", "deleted", "critical"].includes(severity);
                  const isWarning = ["warning", "pending", "provisioning"].includes(severity);
                  return (
                    <tr key={event.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            isError
                              ? "bg-red-50 text-red-700"
                              : isWarning
                                ? "bg-amber-50 text-amber-700"
                                : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {isError ? "Error" : isWarning ? "Warning" : "Info"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-xs text-slate-600">
                        {event.timestampLabel}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-slate-900">{event.label}</td>
                      <td className="max-w-xs truncate py-2.5 text-slate-500">
                        {event.description || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No events recorded yet.</p>
        )}

        {/* Console logs viewer */}
        <ConsoleLogsViewer
          logsData={logsData}
          isLogsLoading={isLogsLoading}
          logLines={logLines}
          setLogLines={setLogLines}
          refetchLogs={() => refetchLogs()}
        />
      </div>
    );
  };

  /** Volumes — Zadara-style volumes table */
  const renderVolumesTab = () => {
    const volumes = Array.isArray(securitySummary.attachedVolumes) ? securitySummary.attachedVolumes : [];
    const dataVolumes = (effectiveMetadata?.["data_volumes"] as GenericRecord[]) || [];
    const allVolumes = [...volumes, ...dataVolumes];

    return (
      <div>
        <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
          <span>{allVolumes.length} Items</span>
        </div>
        {allVolumes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Size</th>
                  <th className="pb-2 pr-4">Disk Type</th>
                  <th className="pb-2 pr-4">Volume Type</th>
                  <th className="pb-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {allVolumes.map((vol: GenericRecord, idx: number) => {
                  const volName = (vol["name"] || vol["volume_label"] || vol["id"] || `Volume ${idx + 1}`) as string;
                  const volSize = (vol["size_gb"] || vol["size"] || vol["volume_size_gb"] || vol["capacity_gb"]) as string | number | undefined;
                  const diskType = (vol["disk_type"] || vol["type"] || "Disk") as string;
                  const volType = (vol["volume_type"] || vol["bus_type"] || "—") as string;
                  const volStatus = (vol["status"] || vol["state"]) as string | undefined;
                  return (
                    <tr key={`${volName}-${idx}`} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 pr-4">
                        <span className="text-blue-600">{volName}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700">
                        {volSize ? `${volSize} GiB` : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-700">{diskType}</td>
                      <td className="py-2.5 pr-4 text-slate-700">{volType}</td>
                      <td className="py-2.5 pr-4">
                        {volStatus ? (
                          <span className="text-green-600">{formatStatusText(volStatus)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No volumes attached.</p>
        )}
      </div>
    );
  };

  /** Networks — Zadara-style network interfaces table */
  const renderNetworksTab = () => {
    const flatAddresses = networkTopology?.flatAddresses || [];
    const publicIps = networkTopology?.publicIps || [];
    const privateIps = networkTopology?.privateIps || [];
    const secGroups = Array.isArray(securitySummary.securityGroups) ? securitySummary.securityGroups : [];

    // Build network rows from flat addresses or IPs
    const networkRows: GenericRecord[] = [];
    if (flatAddresses.length > 0) {
      flatAddresses.forEach((addr: unknown, idx: number) => {
        if (typeof addr === "object" && addr !== null) {
          networkRows.push(addr as GenericRecord);
        } else if (typeof addr === "string") {
          networkRows.push({ addr, index: idx });
        }
      });
    }
    // Fallback: build from public/private IPs
    if (networkRows.length === 0) {
      privateIps.forEach((ip, idx) => {
        networkRows.push({ addr: ip, "OS-EXT-IPS:type": "fixed", version: 4, index: idx });
      });
      publicIps.forEach((ip, idx) => {
        networkRows.push({ addr: ip, "OS-EXT-IPS:type": "floating", version: 4, index: idx + privateIps.length });
      });
    }

    // Check if any row already has an elastic IP attached
    const hasAttachedEip = instanceElasticIps.length > 0;

    // Build network interfaces list for the attach modal
    const nicList = networkRows.map((row) => ({
      port_id: (row["port_id"] || row["network_id"]) as string | undefined,
      ip: (row["addr"] || row["ip_address"] || row["ip"]) as string,
      device_index: row["device_index"] as number | string | undefined,
    })).filter((n) => !!n.ip);

    return (
      <div>
        {/* Sub-action bar */}
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setShowAttachEipModal(true)}
            disabled={hasAttachedEip || !projectId}
            title={hasAttachedEip ? "Elastic IP already attached to this instance" : "Attach Elastic IP"}
            className={`flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition ${
              hasAttachedEip || !projectId
                ? "cursor-not-allowed text-slate-300"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Globe2 className="h-4 w-4" />
            <span className="text-[10px] font-medium">Elastic IP</span>
          </button>
          <div className="ml-auto text-sm text-slate-500">
            {networkRows.length} Items
          </div>
        </div>

        {networkRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-4">Private IP</th>
                  <th className="pb-2 pr-4">Elastic IP</th>
                  <th className="pb-2 pr-4">DNS</th>
                  <th className="pb-2 pr-4">Security Groups</th>
                  <th className="pb-2 pr-4">Device Index</th>
                  <th className="pb-2 pr-4">MAC Address</th>
                  <th className="pb-2 pr-4">Subnet</th>
                  <th className="pb-2 pr-4">CIDR</th>
                </tr>
              </thead>
              <tbody>
                {networkRows.map((row, idx) => {
                  const ip = (row["addr"] || row["ip_address"] || row["ip"]) as string | undefined;
                  const mac = (row["OS-EXT-IPS-MAC:mac_addr"] || row["mac_addr"] || row["mac_address"]) as string | undefined;
                  const subnet = (row["subnet_name"] || row["subnet"] || row["network_name"]) as string | undefined;
                  const cidr = row["cidr"] as string | undefined;
                  const dnsName = row["dns_name"] as string | undefined;
                  const deviceIndex = row["device_index"] as number | string | undefined;
                  const portId = (row["port_id"] || row["network_id"]) as string | undefined;
                  const rowSecGroups = Array.isArray(row["security_groups"]) ? (row["security_groups"] as unknown[]) : secGroups;

                  // Find elastic IP for this NIC
                  const rowEip = portId ? eipByNic.get(portId) : undefined;

                  return (
                    <tr key={`net-${idx}`} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 pr-4 font-mono text-slate-800">{ip || "—"}</td>
                      <td className="py-2.5 pr-4">
                        {rowEip ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-green-700">{rowEip.public_ip}</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(rowEip.public_ip || "")}
                              className="rounded p-0.5 text-slate-400 hover:text-slate-600"
                              title="Copy Elastic IP"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDisassociateElasticIp(rowEip.id)}
                              disabled={isDisassociatingEip}
                              className="rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                              title="Detach Elastic IP"
                            >
                              {isDisassociatingEip ? "..." : "Detach"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-600">{dnsName || "—"}</td>
                      <td className="py-2.5 pr-4">
                        {rowSecGroups.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {rowSecGroups.map((sg: unknown, sgIdx: number) => {
                              const sgName = typeof sg === "object" && sg !== null
                                ? ((sg as GenericRecord)["name"] || (sg as GenericRecord)["id"] || `SG ${sgIdx + 1}`) as string
                                : String(sg);
                              return (
                                <span key={sgIdx} className="text-blue-600">{sgName}</span>
                              );
                            })}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">{deviceIndex != null ? `eth${deviceIndex}` : "—"}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-600">{mac || "—"}</td>
                      <td className="py-2.5 pr-4 text-blue-600">{subnet || "—"}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-600">{cidr || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No network interfaces detected.</p>
        )}

        {/* Attach Elastic IP Modal */}
        <AttachElasticIpModal
          isOpen={showAttachEipModal}
          onClose={() => setShowAttachEipModal(false)}
          networkInterfaces={nicList}
          availableElasticIps={availableElasticIps}
          isLoadingEips={isEipsLoading}
          isAllocating={isAllocatingEip}
          isAssociating={isAssociatingEip}
          onAllocate={handleAllocateElasticIp}
          onAssociate={handleAssociateElasticIp}
        />
      </div>
    );
  };

  /** Monitoring tab — real-time metrics charts */
  const renderMonitoringTab = () => {
    const parseMetricData = (raw: GenericRecord | null | undefined): Array<{ time: string; value: number }> => {
      if (!raw) return [];
      const dataArr = (raw as GenericRecord)?.["data"] || (raw as GenericRecord)?.["samples"] || [];
      if (!Array.isArray(dataArr)) return [];
      return dataArr.map((point: GenericRecord) => {
        const ts = point["timestamp"] || point["time"] || point["t"];
        const val = point["value"] || point["mean"] || point["avg"] || point["v"] || 0;
        const tsNum = typeof ts === "number" ? ts : typeof ts === "string" ? Number(ts) || Date.parse(ts) : 0;
        const date = tsNum ? new Date(tsNum < 1e12 ? tsNum * 1000 : tsNum) : new Date();
        return {
          time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          value: typeof val === "number" ? Math.round(val * 100) / 100 : parseFloat(String(val)) || 0,
        };
      });
    };

    const cpuData = parseMetricData(cpuMetricsRaw as GenericRecord | null);
    const memData = parseMetricData(memMetricsRaw as GenericRecord | null);
    const netData = parseMetricData(netMetricsRaw as GenericRecord | null);
    const isMetricsLoading = isCpuMetricsFetching || isMemMetricsFetching || isNetMetricsFetching;

    const renderChart = (title: string, data: Array<{ time: string; value: number }>, color: string, unit: string) => (
      <ModernCard padding="lg" className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, "auto"]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                formatter={(value: number) => [`${value} ${unit}`, title]}
              />
              <Area type="monotone" dataKey="value" stroke={color} fill={`url(#gradient-${color})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
            {isMetricsLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading metrics...</span>
            ) : (
              "No data available for this period"
            )}
          </div>
        )}
      </ModernCard>
    );

    return (
      <div className="space-y-6">
        {/* Period selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Performance Metrics</h2>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {(["1h", "6h", "24h", "7d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setMetricsRange(range)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  metricsRange === range
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Charts grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {renderChart("CPU Usage", cpuData, "#3b82f6", "%")}
          {renderChart("Memory Usage", memData, "#10b981", "%")}
        </div>
        {renderChart("Network I/O", netData, "#8b5cf6", "kb/s")}

        {/* Legacy telemetry summary */}
        <InstanceTelemetryCard
          telemetrySummary={telemetrySummary}
          usagePeriod={usagePeriod}
          setUsagePeriod={setUsagePeriod}
          isUsageLoading={isUsageLoading}
          usageStats={usageStats as InstanceUsageStats | null}
        />
      </div>
    );
  };

  /** Protection tab — protection plan, backup groups, snapshots, restore groups */
  const renderProtectionTab = () => {
    const backupGroups = Array.isArray((backupGroupsRaw as GenericRecord)?.["backup_groups"])
      ? ((backupGroupsRaw as GenericRecord)["backup_groups"] as GenericRecord[])
      : [];
    const snapshots = Array.isArray((snapshotsRaw as GenericRecord)?.["snapshots"])
      ? ((snapshotsRaw as GenericRecord)["snapshots"] as GenericRecord[])
      : [];
    const restoreGroups = Array.isArray((restoreGroupsRaw as GenericRecord)?.["restore_groups"])
      ? ((restoreGroupsRaw as GenericRecord)["restore_groups"] as GenericRecord[])
      : [];

    const backupEnabled = acfBackupStatus?.enabled ?? false;
    const replicationEnabled = acfReplicationStatus?.enabled ?? false;
    const replicationHealth = acfReplicationStatus?.health ?? "unknown";
    const replicationLag = acfReplicationStatus?.lag_seconds;
    const replicationTarget = acfReplicationStatus?.target_region;

    const protectionLevel = replicationEnabled
      ? "dr_replication"
      : backupEnabled
        ? "backup_only"
        : "none";

    const protectionLevelLabel: Record<string, string> = {
      none: "No Protection",
      backup_only: "Backup Only",
      dr_replication: "DR Standby + AnyCloudFlow Replication",
    };

    const protectionLevelColor: Record<string, string> = {
      none: "text-red-600 bg-red-50 border-red-200",
      backup_only: "text-amber-600 bg-amber-50 border-amber-200",
      dr_replication: "text-green-600 bg-green-50 border-green-200",
    };

    const handleEnableBackup = async () => {
      if (!instanceDbId) return;
      try {
        await enableBackupMutation.mutateAsync({
          integrationKey: "anycloudflow",
          resourceType: "instance",
          resourceId: instanceDbId,
          config: { schedule: "daily", retention_days: 7 },
        });
        ToastUtils.success("Backup protection enabled");
      } catch (e) {
        ToastUtils.error(getErrorMessage(e, "Failed to enable backup"));
      }
    };

    const handleDisableBackup = async () => {
      if (!instanceDbId) return;
      if (!globalThis.confirm("Disable backup protection? Existing snapshots will be retained.")) return;
      try {
        await disableBackupMutation.mutateAsync({
          integrationKey: "anycloudflow",
          resourceType: "instance",
          resourceId: instanceDbId,
        });
        ToastUtils.success("Backup protection disabled");
      } catch (e) {
        ToastUtils.error(getErrorMessage(e, "Failed to disable backup"));
      }
    };

    const handleTriggerManualBackup = async () => {
      if (!instanceDbId) return;
      try {
        await triggerBackupMutation.mutateAsync({
          integrationKey: "anycloudflow",
          resourceType: "instance",
          resourceId: instanceDbId,
        });
        ToastUtils.success("Manual backup triggered");
      } catch (e) {
        ToastUtils.error(getErrorMessage(e, "Failed to trigger backup"));
      }
    };

    const handleEnableReplication = async () => {
      if (!instanceDbId) return;
      try {
        await enableReplicationMutation.mutateAsync({
          integrationKey: "anycloudflow",
          resourceType: "instance",
          resourceId: instanceDbId,
          config: { mode: "continuous" },
        });
        ToastUtils.success("DR replication enabled");
      } catch (e) {
        ToastUtils.error(getErrorMessage(e, "Failed to enable replication"));
      }
    };

    const handleDisableReplication = async () => {
      if (!instanceDbId) return;
      if (!globalThis.confirm("Disable DR replication? The standby VM will stop receiving updates.")) return;
      try {
        await disableReplicationMutation.mutateAsync({
          integrationKey: "anycloudflow",
          resourceType: "instance",
          resourceId: instanceDbId,
        });
        ToastUtils.success("DR replication disabled");
      } catch (e) {
        ToastUtils.error(getErrorMessage(e, "Failed to disable replication"));
      }
    };

    const handleFailover = async () => {
      if (!instanceDbId) return;
      if (!globalThis.confirm("Initiate failover? This will activate the standby VM and redirect traffic.")) return;
      try {
        await failoverMutation.mutateAsync({
          integrationKey: "anycloudflow",
          resourceType: "instance",
          resourceId: instanceDbId,
        });
        ToastUtils.success("Failover initiated");
      } catch (e) {
        ToastUtils.error(getErrorMessage(e, "Failed to initiate failover"));
      }
    };

    const handleCreateBackup = async () => {
      if (!instanceIdentifier || !backupFormName.trim()) return;
      try {
        await createBackupGroupMutation({ identifier: instanceIdentifier, params: { name: backupFormName.trim() } });
        ToastUtils.success("Backup group created");
        setBackupFormName("");
        setShowCreateBackupForm(false);
        refetchBackupGroups();
      } catch (e) {
        ToastUtils.error(getErrorMessage(e, "Failed to create backup group"));
      }
    };

    const handleDeleteBackup = async (groupId: string) => {
      if (!instanceIdentifier) return;
      if (!globalThis.confirm("Delete this backup group? This cannot be undone.")) return;
      try {
        await deleteBackupGroupMutation({ identifier: instanceIdentifier, groupId });
        ToastUtils.success("Backup group deleted");
        refetchBackupGroups();
      } catch (e) {
        ToastUtils.error(getErrorMessage(e, "Failed to delete backup group"));
      }
    };

    const handleTriggerSnapshot = async (groupId: string) => {
      if (!instanceIdentifier) return;
      try {
        await triggerSnapshotMutation({ identifier: instanceIdentifier, groupId });
        ToastUtils.success("Snapshot triggered");
        refetchSnapshots();
      } catch (e) {
        ToastUtils.error(getErrorMessage(e, "Failed to trigger snapshot"));
      }
    };

    const handleDeleteSnapshot = async (snapshotId: string) => {
      if (!instanceIdentifier) return;
      if (!globalThis.confirm("Delete this snapshot?")) return;
      try {
        await deleteSnapshotMutation({ identifier: instanceIdentifier, snapshotId });
        ToastUtils.success("Snapshot deleted");
        refetchSnapshots();
      } catch (e) {
        ToastUtils.error(getErrorMessage(e, "Failed to delete snapshot"));
      }
    };

    const handleDeleteRestoreGroup = async (groupId: string) => {
      if (!instanceIdentifier) return;
      if (!globalThis.confirm("Delete this restore group?")) return;
      try {
        await deleteRestoreGroupMutation({ identifier: instanceIdentifier, groupId });
        ToastUtils.success("Restore group deleted");
        refetchRestoreGroups();
      } catch (e) {
        ToastUtils.error(getErrorMessage(e, "Failed to delete restore group"));
      }
    };

    const _isLoading = isBackupGroupsFetching || isSnapshotsFetching || isRestoreGroupsFetching;

    return (
      <div className="space-y-8">
        {/* Protection Plan Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-900">Protection Plan</h3>
          </div>

          {/* Current plan badge */}
          <div className={`flex items-center justify-between rounded-lg border p-4 ${protectionLevelColor[protectionLevel]}`}>
            <div>
              <p className="text-sm font-semibold">{protectionLevelLabel[protectionLevel]}</p>
              <p className="mt-0.5 text-xs opacity-75">
                {protectionLevel === "none" && "This instance has no active protection. Enable backup or DR to protect your data."}
                {protectionLevel === "backup_only" && "Daily snapshots are active. Consider upgrading to DR for continuous replication."}
                {protectionLevel === "dr_replication" && "Continuous block-level replication via AnyCloudFlow is active."}
              </p>
            </div>
            {protectionLevel === "none" && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </span>
            )}
            {protectionLevel === "backup_only" && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                <Shield className="h-4 w-4 text-amber-500" />
              </span>
            )}
            {protectionLevel === "dr_replication" && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <ShieldCheck className="h-4 w-4 text-green-500" />
              </span>
            )}
          </div>

          {/* Status cards grid */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Backup status */}
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Shield className="h-3.5 w-3.5" /> Backup
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-sm font-semibold ${backupEnabled ? "text-green-600" : "text-slate-400"}`}>
                  {backupEnabled ? "Enabled" : "Disabled"}
                </span>
                {backupEnabled ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleTriggerManualBackup}
                      disabled={triggerBackupMutation.isPending}
                      className="rounded p-1 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                      title="Trigger Manual Backup"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleDisableBackup}
                      disabled={disableBackupMutation.isPending}
                      className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Disable Backup"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEnableBackup}
                    disabled={enableBackupMutation.isPending}
                    className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Enable
                  </button>
                )}
              </div>
              {backupEnabled && acfBackupStatus?.next_backup_at && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Next: {formatDateTime(acfBackupStatus.next_backup_at)}
                </p>
              )}
              {backupEnabled && acfBackupStatus?.snapshots_count != null && (
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {acfBackupStatus.snapshots_count} snapshot{acfBackupStatus.snapshots_count !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* DR Replication status */}
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <ArrowUpDown className="h-3.5 w-3.5" /> DR Replication
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-sm font-semibold ${replicationEnabled ? "text-green-600" : "text-slate-400"}`}>
                  {replicationEnabled ? "Active" : "Disabled"}
                </span>
                {replicationEnabled ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleFailover}
                      disabled={failoverMutation.isPending}
                      className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                      title="Initiate Failover"
                    >
                      <Zap className="mr-1 inline h-3 w-3" />Failover
                    </button>
                    <button
                      onClick={handleDisableReplication}
                      disabled={disableReplicationMutation.isPending}
                      className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Disable Replication"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEnableReplication}
                    disabled={enableReplicationMutation.isPending}
                    className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Enable
                  </button>
                )}
              </div>
              {replicationEnabled && (
                <div className="mt-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Activity className={`h-3 w-3 ${replicationHealth === "healthy" ? "text-green-500" : replicationHealth === "degraded" ? "text-amber-500" : "text-red-500"}`} />
                    <span className="text-[10px] text-slate-500 capitalize">{replicationHealth}</span>
                  </div>
                  {replicationLag != null && (
                    <p className="text-[10px] text-slate-400">Lag: {replicationLag}s</p>
                  )}
                  {replicationTarget && (
                    <p className="text-[10px] text-slate-400">Target: {replicationTarget}</p>
                  )}
                </div>
              )}
            </div>

            {/* AnyCloudFlow integration status */}
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <RefreshCw className="h-3.5 w-3.5" /> AnyCloudFlow
              </div>
              <div className="mt-2">
                <span className={`text-sm font-semibold ${replicationEnabled || backupEnabled ? "text-green-600" : "text-slate-400"}`}>
                  {replicationEnabled ? "Replicating" : backupEnabled ? "Backing up" : "Not in use"}
                </span>
              </div>
              {replicationEnabled && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Continuous block-level replication with automated failover
                </p>
              )}
              {!replicationEnabled && backupEnabled && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Scheduled snapshots with point-in-time restore
                </p>
              )}
              {!replicationEnabled && !backupEnabled && (
                <p className="mt-1 text-[10px] text-slate-400">
                  Enable backup or DR to use AnyCloudFlow services
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Backup Groups */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <h3 className="text-base font-semibold text-slate-900">Backup Groups</h3>
              <span className="text-xs text-slate-400">({backupGroups.length})</span>
            </div>
            <button
              onClick={() => setShowCreateBackupForm(!showCreateBackupForm)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" /> Create Group
            </button>
          </div>

          {showCreateBackupForm && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <input
                type="text"
                value={backupFormName}
                onChange={(e) => setBackupFormName(e.target.value)}
                placeholder="Backup group name"
                className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button onClick={handleCreateBackup} className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                Create
              </button>
              <button onClick={() => setShowCreateBackupForm(false)} className="text-xs text-slate-500 hover:text-slate-700">
                Cancel
              </button>
            </div>
          )}

          {isBackupGroupsFetching && !backupGroups.length ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading backup groups...
            </div>
          ) : backupGroups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Resources</th>
                    <th className="pb-2 pr-4">Schedule</th>
                    <th className="pb-2 pr-4">Last Snapshot</th>
                    <th className="pb-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backupGroups.map((group, idx) => {
                    const id = String(group["id"] || group["backup_group_id"] || idx);
                    return (
                      <tr key={id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2.5 pr-4 font-medium text-blue-600">
                          {String(group["name"] || group["display_name"] || `Group ${idx + 1}`)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            {formatStatusText(String(group["status"] || "active"))}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">
                          {String(group["resource_count"] || group["resources_count"] || "0")}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">
                          {String(group["schedule"] || group["frequency"] || "Manual")}
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">
                          {group["last_snapshot_at"] ? formatDateTime(group["last_snapshot_at"]) : "Never"}
                        </td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleTriggerSnapshot(id)}
                              className="rounded p-1 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                              title="Take Snapshot"
                            >
                              <Camera className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBackup(id)}
                              className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No backup groups configured. Create one to protect your resources.</p>
          )}
        </div>

        {/* Snapshots */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-semibold text-slate-900">Snapshots</h3>
            <span className="text-xs text-slate-400">({snapshots.length})</span>
          </div>
          {isSnapshotsFetching && !snapshots.length ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading snapshots...
            </div>
          ) : snapshots.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Group</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Size</th>
                    <th className="pb-2 pr-4">Created</th>
                    <th className="pb-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snap, idx) => {
                    const snapId = String(snap["id"] || snap["snapshot_id"] || idx);
                    return (
                      <tr key={snapId} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2.5 pr-4 font-medium text-blue-600">
                          {String(snap["name"] || snap["display_name"] || `Snapshot ${idx + 1}`)}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">
                          {String(snap["backup_group_name"] || snap["group_name"] || "—")}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            {formatStatusText(String(snap["status"] || "completed"))}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">
                          {snap["size"] ? `${snap["size"]} GB` : "—"}
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">
                          {formatDateTime(snap["created_at"] || snap["timestamp"])}
                        </td>
                        <td className="py-2.5 pr-4">
                          <button
                            onClick={() => handleDeleteSnapshot(snapId)}
                            className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete Snapshot"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No snapshots available.</p>
          )}
        </div>

        {/* Restore Groups */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-semibold text-slate-900">Restore Groups</h3>
            <span className="text-xs text-slate-400">({restoreGroups.length})</span>
          </div>
          {isRestoreGroupsFetching && !restoreGroups.length ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading restore groups...
            </div>
          ) : restoreGroups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Source Snapshot</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Created</th>
                    <th className="pb-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restoreGroups.map((rg, idx) => {
                    const rgId = String(rg["id"] || rg["restore_group_id"] || idx);
                    return (
                      <tr key={rgId} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2.5 pr-4 font-medium text-blue-600">
                          {String(rg["name"] || rg["display_name"] || `Restore ${idx + 1}`)}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">
                          {String(rg["snapshot_name"] || rg["source_snapshot"] || "—")}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            {formatStatusText(String(rg["status"] || "available"))}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">
                          {formatDateTime(rg["created_at"] || rg["timestamp"])}
                        </td>
                        <td className="py-2.5 pr-4">
                          <button
                            onClick={() => handleDeleteRestoreGroup(rgId)}
                            className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete Restore Group"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-slate-400">No restore groups created.</p>
          )}
        </div>
      </div>
    );
  };

  /** Alarms tab — alarm types, active alarms, entity alarms */
  const renderAlarmsTab = () => {
    const alarmsList = Array.isArray(providerAlarms?.["alarms"])
      ? (providerAlarms!["alarms"] as GenericRecord[])
      : [];

    const handleCloseAlarm = async (alarmId: string) => {
      if (!instanceIdentifier) return;
      if (!globalThis.confirm("Close this alarm?")) return;
      try {
        await closeAlarmMutation({ identifier: instanceIdentifier, alarmId });
        ToastUtils.success("Alarm closed");
      } catch (e) {
        ToastUtils.error(getErrorMessage(e, "Failed to close alarm"));
      }
    };

    // Group alarms by severity
    const criticalAlarms = alarmsList.filter((a) => String(a["severity"] || "").toLowerCase() === "critical");
    const warningAlarms = alarmsList.filter((a) => String(a["severity"] || "").toLowerCase() === "warning");
    const infoAlarms = alarmsList.filter((a) => !["critical", "warning"].includes(String(a["severity"] || "").toLowerCase()));

    return (
      <div className="space-y-6">
        {/* Summary banner */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className={`rounded-lg border p-4 ${criticalAlarms.length > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center gap-2">
              <Bell className={`h-5 w-5 ${criticalAlarms.length > 0 ? "text-red-500" : "text-slate-400"}`} />
              <div>
                <p className="text-2xl font-bold text-slate-900">{criticalAlarms.length}</p>
                <p className="text-xs text-slate-500">Critical</p>
              </div>
            </div>
          </div>
          <div className={`rounded-lg border p-4 ${warningAlarms.length > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${warningAlarms.length > 0 ? "text-amber-500" : "text-slate-400"}`} />
              <div>
                <p className="text-2xl font-bold text-slate-900">{warningAlarms.length}</p>
                <p className="text-xs text-slate-500">Warning</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <BellOff className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{infoAlarms.length}</p>
                <p className="text-xs text-slate-500">Informational</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alarms table */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Active Alarms ({alarmsList.length})</h3>
          </div>
          {alarmsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="pb-2 pr-4">Severity</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Description</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Created</th>
                    <th className="pb-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alarmsList.map((alarm, idx) => {
                    const alarmId = String(alarm["alarm_id"] || alarm["id"] || idx);
                    const severity = String(alarm["severity"] || "info").toLowerCase();
                    const isCritical = severity === "critical";
                    const isWarning = severity === "warning";
                    return (
                      <tr key={alarmId} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2.5 pr-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              isCritical
                                ? "bg-red-50 text-red-700"
                                : isWarning
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {isCritical ? "Critical" : isWarning ? "Warning" : "Info"}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-medium text-slate-900">
                          {String(alarm["alarm_type"] || alarm["type"] || alarm["name"] || `Alarm ${idx + 1}`)}
                        </td>
                        <td className="max-w-xs truncate py-2.5 pr-4 text-slate-600">
                          {String(alarm["description"] || alarm["message"] || "—")}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {formatStatusText(String(alarm["status"] || "active"))}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">
                          {formatDateTime(alarm["created_at"] || alarm["timestamp"])}
                        </td>
                        <td className="py-2.5 pr-4">
                          <button
                            onClick={() => handleCloseAlarm(alarmId)}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Close Alarm"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <BellOff className="h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-400">No active alarms. All systems normal.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  /** Billing tab */
  const renderBillingTab = () => {
    const hasBilling = totalCost > 0 || enhancedTransactions.length > 0;
    const nextBilling = displayInstance.next_billing_date;

    return (
      <div className="space-y-6">
        {/* Billing status banner */}
        <div className="rounded-lg border border-slate-200 p-4">
          {hasBilling ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Active Billing &mdash; Est. monthly: {formatMoney(totalCost, currency)}
                </p>
                {nextBilling && (
                  <p className="text-xs text-slate-500">Next billing: {formatDateTime(nextBilling)}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">No active billing</p>
                <p className="text-xs text-slate-500">
                  This instance was fast-tracked and has no active billing. Set up billing to start charging.
                </p>
              </div>
            </div>
          )}
        </div>

        <InstancePricingCard parsedPricingBreakdown={parsedPricingBreakdown} currency={currency} />
        <TransactionsCard enhancedTransactions={enhancedTransactions} currency={currency} />
        <InstanceMetadataForm
          metadataForm={metadataForm}
          setMetadataForm={setMetadataForm}
          managedInstance={managedInstance}
          isMetadataUpdating={isMetadataUpdating}
          onSubmit={handleMetadataSubmit}
        />
      </div>
    );
  };

  const tabContent: Record<TabId, () => React.ReactNode> = {
    overview: renderOverviewTab,
    events: renderEventsTab,
    volumes: renderVolumesTab,
    networks: renderNetworksTab,
    monitoring: renderMonitoringTab,
    protection: renderProtectionTab,
    alarms: renderAlarmsTab,
    billing: renderBillingTab,
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <AdminPageShell
      title={displayInstance.name || displayInstance.identifier || "Instance"}
      description={
        displayInstance.region
          ? `${displayInstance.region} \u2022 ${displayInstance.identifier || "\u2014"}`
          : displayInstance.identifier || "Instance overview"
      }
      contentClassName="space-y-0"
    >
      {/* Zadara-style header: action bar + info strip + tags */}
      <InstanceHeroBanner
        name={displayInstance.name}
        identifier={displayInstance.identifier}
        status={displayInstance.status}
        provider={displayInstance.provider}
        instanceType={computeProps.name || (effectiveMetadata?.["instance_type"] as string)}
        availabilityZone={(displayInstance as GenericRecord)?.["availability_zone"] as string | undefined}
        providerVmId={(providerVm?.["provider_vm_id"] || providerVm?.["id"]) as string | undefined}
        projectName={displayInstance.project?.name}
        primaryIp={networkTopology?.primaryIp || (networkTopology?.privateIps?.[0])}
        elasticIp={instanceElasticIps?.[0]?.public_ip}
        subnetName={undefined}
        cpuUsage={activityMetrics.cpuUsage}
        memoryUsage={activityMetrics.memoryUsage}
        networkRx={activityMetrics.networkRx}
        networkTx={activityMetrics.networkTx}
        vcpus={computeProps.vcpus}
        memoryGb={computeProps.memoryGb}
        storageGb={storageGb}
        tags={tags}
        availableActions={availableActions}
        supportsInstanceActions={supportsInstanceActions}
        pendingAction={pendingAction}
        isConsoleLoading={isConsoleLoading || isConsoleFetching}
        onGoBack={handleGoBack}
        onAction={handleInstanceAction}
        onOpenConsole={handleOpenConsole}
        onRefreshStatus={handleRefreshStatus}
        onCopyIdentifier={handleCopyIdentifier}
      />

      {/* Zadara-style tab navigation */}
      <div className="mt-0 border-b border-slate-200 bg-white">
        <div className="flex overflow-x-auto no-scrollbar">
          {TAB_IDS.map((tabId) => {
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {TAB_LABELS[tabId]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="border border-t-0 border-slate-200 bg-white p-6">
        {tabContent[activeTab]?.() ?? null}
      </div>

      <InstanceResizeModal
        isOpen={showResizeModal}
        onClose={() => setShowResizeModal(false)}
        instanceId={Number(displayInstance?.id) || 0}
        instanceName={displayInstance?.name || instanceIdentifier}
        currentStatus={String(displayInstance?.status || "unknown")}
        isAdmin
        onSuccess={() => {
          refetchManagement();
          refetchLifecycle();
        }}
      />
    </AdminPageShell>
  );
};

export default AdminInstancesDetails;
