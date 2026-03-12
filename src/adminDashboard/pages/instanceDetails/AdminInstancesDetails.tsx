import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  HardDrive,
  Link as LinkIcon,
  RefreshCw,
  Server,
  Terminal,
  Wallet,
  Loader2,
} from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import { ModernButton, ModernCard } from "@/shared/components/ui";
import ModernStatsCard from "@/shared/components/ui/ModernStatsCard";
import ToastUtils from "@/utils/toastUtil";
import {
  useFetchInstanceManagementDetails,
  useInstanceManagementAction,
  useRefreshInstanceStatus,
  useInstanceUsageStats,
  useInstanceLogs,
  useUpdateInstanceMetadata,
} from "@/shared/hooks/resources/instanceHooks";
import {
  useAdminFetchInstanceConsoleById,
  useAdminFetchInstanceLifecycleById,
} from "@/hooks/sharedResourceHooks";

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

import InstanceLifecycleControls from "./InstanceLifecycleControls";
import InstanceTelemetryCard from "./InstanceTelemetryCard";
import InstancePricingCard, { TransactionsCard } from "./InstancePricingCard";
import { ConsoleLogsViewer, LifecycleTimeline } from "./ConsoleLogsViewer";
import InstanceHeroBanner from "./InstanceHeroBanner";
import InstanceOverviewCard from "./InstanceOverviewCard";
import NetworkSecurityCard from "./NetworkSecurityCard";
import InstanceMetadataForm from "./InstanceMetadataForm";

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

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

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
      const result = (fetchResult.data as unknown as GenericRecord | undefined) || {};
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

  // ---------------------------------------------------------------------------
  // Stats cards
  // ---------------------------------------------------------------------------

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
            ? `${cores} vCPU \u2022 ${memoryMb > 0 ? `${Math.round(memoryMb / 1024)} GiB RAM` : "\u2014"}`
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
        value: typeof totalCost === "number" ? formatMoney(totalCost, currency) : "\u2014",
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

  // ---------------------------------------------------------------------------
  // Header actions
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Early returns for error / loading states
  // ---------------------------------------------------------------------------

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
          <span className="text-sm text-gray-600">Loading instance details...</span>
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

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <AdminPageShell
      title={displayInstance.name || "Instance"}
      description={
        displayInstance.region
          ? `${displayInstance.region} \u2022 ${displayInstance.identifier || "\u2014"}`
          : displayInstance.identifier || "Instance overview"
      }
      actions={headerActions}
      contentClassName="space-y-8"
    >
      {/* Hero banner */}
      <InstanceHeroBanner
        name={displayInstance.name}
        identifier={displayInstance.identifier}
        region={displayInstance.region}
        status={displayInstance.status}
        billingStatus={displayInstance.billing_status}
        fulfillmentMode={displayInstance.fulfillment_mode}
        isAutoSyncing={isAutoSyncing}
        pendingAction={pendingAction}
        onGoBack={handleGoBack}
        onRefreshStatus={handleRefreshStatus}
        onCopyIdentifier={handleCopyIdentifier}
      />

      {/* Stats cards */}
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

      {/* Lifecycle controls */}
      <InstanceLifecycleControls
        supportsInstanceActions={supportsInstanceActions}
        availableActions={availableActions}
        displayStatus={displayInstance.status}
        pendingAction={pendingAction}
        onAction={handleInstanceAction}
      />

      {/* Instance overview + Network & Security grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <InstanceOverviewCard
          displayInstance={displayInstance}
          effectiveMetadata={effectiveMetadata}
        />

        {/* Network & Security + Provider Snapshot sidebar */}
        <NetworkSecurityCard
          displayInstance={displayInstance}
          effectiveMetadata={effectiveMetadata}
          networkInfo={networkInfo}
          securityInfo={securityInfo}
          providerDetails={providerDetails}
        />
      </div>

      {/* Telemetry card */}
      <InstanceTelemetryCard
        telemetrySummary={telemetrySummary}
        usagePeriod={usagePeriod}
        setUsagePeriod={setUsagePeriod}
        isUsageLoading={isUsageLoading}
        usageStats={usageStats as InstanceUsageStats | null}
      />

      {/* Lifecycle timeline + Console logs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LifecycleTimeline
          lifecycleEvents={lifecycleEvents}
          refetchLifecycle={() => refetchLifecycle()}
        />
        <ConsoleLogsViewer
          logsData={logsData}
          isLogsLoading={isLogsLoading}
          logLines={logLines}
          setLogLines={setLogLines}
          refetchLogs={() => refetchLogs()}
        />
      </div>

      {/* Metadata & Tags form */}
      <InstanceMetadataForm
        metadataForm={metadataForm}
        setMetadataForm={setMetadataForm}
        managedInstance={managedInstance}
        isMetadataUpdating={isMetadataUpdating}
        onSubmit={handleMetadataSubmit}
      />

      {/* Pricing breakdown */}
      <InstancePricingCard parsedPricingBreakdown={parsedPricingBreakdown} currency={currency} />

      {/* Transactions */}
      <TransactionsCard enhancedTransactions={enhancedTransactions} currency={currency} />
    </AdminPageShell>
  );
};

export default AdminInstancesDetails;
