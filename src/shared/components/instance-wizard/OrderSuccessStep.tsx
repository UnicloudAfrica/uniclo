import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle } from "lucide-react";
import { ModernButton, ModernModal } from "../ui";
import SetupProgressCard from "../projects/details/SetupProgressCard";
import { useApiContext } from "../../../hooks/useApiContext";
import { useInstanceBroadcasting } from "../../../hooks/useInstanceBroadcasting";
import ToastUtils from "../../../utils/toastUtil";

interface ConfigurationSummary {
  id: string;
  name?: string;
  title?: string;
  region?: string;
  regionLabel?: string;
  count?: number | string;
  months?: number | string;
  canFastTrack?: boolean;
}

interface PricingSummary {
  currency: string;
  grandTotal: number;
}

interface KeypairDownload {
  id?: string | number;
  name: string;
  material: string;
  project_name?: string;
  region?: string;
}

interface PipelineStep {
  id: string;
  label: string;
  status: "completed" | "pending" | "not_started" | "failed";
  description?: string;
  updated_at?: string;
  context?: Record<string, any>;
}

interface InstanceSummary {
  key: string;
  name: string;
  identifier: string;
}

interface ConfigurationPipelineGroup {
  key: string;
  title: string;
  subtitle: string;
  termLabel: string;
  instanceIds: string[];
  instanceCount: number;
  instanceSummaries: InstanceSummary[];
  requiresElasticIp: boolean;
  requiresDataVolumes: boolean;
}

interface OrderSuccessStepProps {
  orderId?: string;
  transactionId?: string;
  isFastTrack?: boolean;
  configurationSummaries: ConfigurationSummary[];
  pricingSummary?: PricingSummary;
  keypairDownloads?: KeypairDownload[];
  instances?: any[];
  instancesPageUrl: string;
  onCreateAnother: () => void;
  resourceLabel?: string;
}

const DEFAULT_INSTANCE_PIPELINE: PipelineStep[] = [
  {
    id: "queue_provisioning",
    label: "Provisioning queued",
    status: "not_started",
    description: "Provisioning will begin shortly.",
  },
  {
    id: "resolve_inputs",
    label: "Validating configuration",
    status: "not_started",
    description: "Checking compute, image, and network prerequisites.",
  },
  {
    id: "project_created",
    label: "Project ready",
    status: "not_started",
    description: "Ensuring project context and access.",
  },
  {
    id: "infrastructure_ready",
    label: "Infrastructure ready",
    status: "not_started",
    description: "Preparing VPC, networks, and security groups.",
  },
  {
    id: "keypair_ready",
    label: "Key pair ready",
    status: "not_started",
    description: "Preparing SSH access credentials.",
  },
  {
    id: "sync_user_access",
    label: "Access synchronized",
    status: "not_started",
    description: "Syncing user permissions on the project.",
  },
  {
    id: "create_instance",
    label: "Creating instance",
    status: "not_started",
    description: "Allocating compute resources.",
  },
  {
    id: "wait_for_active",
    label: "Booting and health checks",
    status: "not_started",
    description: "Booting the instance and running readiness checks.",
  },
  {
    id: "allocate_elastic_ip",
    label: "Elastic IP allocation",
    status: "not_started",
    description: "Allocating and attaching Elastic IPs.",
  },
  {
    id: "attach_data_volumes",
    label: "Data volumes",
    status: "not_started",
    description: "Creating and attaching additional volumes.",
  },
  {
    id: "post_provision",
    label: "Finalizing resources",
    status: "not_started",
    description: "Final checks and bookkeeping.",
  },
  {
    id: "instance_ready",
    label: "Instance ready",
    status: "not_started",
    description: "Provisioning complete.",
  },
];

const normalizeStatus = (status?: string | null): PipelineStep["status"] => {
  const normalized = String(status || "").toLowerCase();
  if (["completed", "complete", "done", "success"].includes(normalized)) return "completed";
  if (["pending", "processing", "queued", "running", "in_progress"].includes(normalized))
    return "pending";
  if (["failed", "error"].includes(normalized)) return "failed";
  return "not_started";
};

const normalizeText = (value?: string | number | null): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const resolveInstanceKey = (instance: any): string => {
  const id = instance?.id;
  if (id !== null && id !== undefined) {
    const normalized = normalizeText(id);
    if (normalized) return normalized;
  }

  const identifier = normalizeText(instance?.identifier);
  if (identifier) return identifier;

  return "";
};

const resolveInstanceLookupId = (instance: any): string => {
  const identifier = normalizeText(instance?.identifier);
  if (identifier) return identifier;

  const id = instance?.id;
  if (id !== null && id !== undefined) {
    const normalized = normalizeText(id);
    if (normalized) return normalized;
  }

  return "";
};

const resolveInstanceName = (instance: any, fallbackIndex?: number): string => {
  const name = normalizeText(instance?.name);
  if (name) return name;

  if (Array.isArray(instance?.tags)) {
    const tag = instance.tags.find(
      (entry: any) => normalizeText(entry?.key).toLowerCase() === "name"
    );
    const tagValue = normalizeText(tag?.value);
    if (tagValue) return tagValue;
  }

  if (Number.isFinite(fallbackIndex)) {
    return `Instance ${fallbackIndex}`;
  }

  return "Instance";
};

const resolveAdditionalVolumes = (instance: any): any[] => {
  const configVolumes = instance?.configuration?.additional_volumes;
  if (Array.isArray(configVolumes) && configVolumes.length > 0) {
    return configVolumes;
  }

  const metadataVolumes = instance?.metadata?.data_volumes ?? instance?.metadata?.volumes_to_attach;
  if (Array.isArray(metadataVolumes) && metadataVolumes.length > 0) {
    return metadataVolumes;
  }

  const tagVolumes = instance?.tags?.data_volumes;
  if (Array.isArray(tagVolumes) && tagVolumes.length > 0) {
    return tagVolumes;
  }

  return [];
};

const normalizeVolumeEntry = (volume: any) => {
  if (!volume) return null;
  const typeId = normalizeText(volume.volume_type_id ?? volume.id ?? volume.type_id ?? "");
  const name = normalizeText(volume.name ?? "");
  const size = normalizeText(volume.storage_size_gb ?? volume.size_gb ?? volume.size ?? "");
  if (!typeId && !name && !size) return null;
  return { typeId, name, size };
};

const hasElasticIp = (instance: any): boolean => {
  const countValue = Number(
    instance?.floating_ip_count ?? instance?.configuration?.floating_ip_count ?? 0
  );
  return Number.isFinite(countValue) && countValue > 0;
};

const hasDataVolumes = (instance: any): boolean => {
  const volumes = resolveAdditionalVolumes(instance);
  return volumes.some((volume) => Boolean(normalizeVolumeEntry(volume)));
};

const formatVolumeEntry = (entry: { typeId: string; name: string; size: string }) => {
  const labelBase = entry.name || (entry.typeId ? `Volume ${entry.typeId}` : "Volume");
  const sizeLabel = entry.size ? `${entry.size}GB` : "";
  return [labelBase, sizeLabel].filter(Boolean).join(" ");
};

const buildVolumeSummary = (primary: any, additional: any[]) => {
  const primaryEntry = normalizeVolumeEntry(primary);
  const extraEntries = Array.isArray(additional)
    ? additional.map(normalizeVolumeEntry).filter(Boolean)
    : [];

  const primarySignature = primaryEntry
    ? `${primaryEntry.typeId || primaryEntry.name || "primary"}:${primaryEntry.size}`
    : "";
  const extraSignatures = extraEntries
    .map((entry: any) => `${entry.typeId || entry.name || "extra"}:${entry.size}`)
    .sort();
  const signature =
    [primarySignature, extraSignatures.join("|")].filter(Boolean).join("::") || "volume:none";

  const labelParts: string[] = [];
  if (primaryEntry) {
    labelParts.push(`Primary: ${formatVolumeEntry(primaryEntry)}`);
  }
  if (extraEntries.length > 0) {
    const extras = extraEntries.map((entry: any) => formatVolumeEntry(entry)).join(", ");
    labelParts.push(`Extra: ${extras}`);
  }
  const label = labelParts.length > 0 ? labelParts.join(" | ") : "N/A";

  return { signature, label };
};

const buildConfigurationKey = (instance: any) => {
  const config = instance?.configuration || {};
  const regionKey = normalizeText(instance?.region || config.region || config.regionLabel);
  const projectKey = normalizeText(
    config?.project?.id || config?.project?.identifier || config?.project?.name || ""
  );
  const computeKey = normalizeText(config?.compute?.id || config?.compute?.name || "");
  const imageKey = normalizeText(config?.os_image?.id || config?.os_image?.name || "");
  const volumeKey = buildVolumeSummary(
    config?.primary_volume,
    config?.additional_volumes || []
  ).signature;
  const keypairKey = normalizeText(
    config?.key_name || instance?.key_name || instance?.metadata?.key_name || ""
  );

  const compositeKey = [regionKey, projectKey, computeKey, imageKey, volumeKey, keypairKey]
    .filter(Boolean)
    .join("||");
  if (compositeKey.length > 0) return compositeKey;
  return `instance:${normalizeText(instance?.id || "") || Math.random().toString(36)}`;
};

const buildConfigurationLabel = (instance: any) => {
  const config = instance?.configuration || {};
  const regionLabel =
    normalizeText(instance?.region || config.regionLabel || config.region) || "Region";
  const projectLabel =
    normalizeText(config?.project?.name || config?.project?.identifier || "") || "Project";
  const computeLabel =
    normalizeText(config?.compute?.name || config?.compute?.id || "") || "Compute";
  const imageLabel = normalizeText(config?.os_image?.name || config?.os_image?.id || "") || "Image";
  const { label: volumeLabel } = buildVolumeSummary(
    config?.primary_volume,
    config?.additional_volumes || []
  );
  const keypairLabel =
    normalizeText(config?.key_name || instance?.key_name || instance?.metadata?.key_name || "") ||
    "None";
  const monthsValue = Number(config?.months ?? instance?.months);

  const title = `${projectLabel} / ${regionLabel}`;
  const subtitleParts = [
    `Compute: ${computeLabel}`,
    `Image: ${imageLabel}`,
    `Volume: ${volumeLabel}`,
    `Keypair: ${keypairLabel}`,
  ];

  return {
    title,
    subtitle: subtitleParts.join(" | "),
    monthsValue: Number.isFinite(monthsValue) ? monthsValue : null,
  };
};

/**
 * Shared order confirmation/success step for provisioning wizards.
 * Displays order ID, configuration summaries, and navigation actions.
 */
const OrderSuccessStep: React.FC<OrderSuccessStepProps> = ({
  orderId,
  transactionId,
  isFastTrack = false,
  configurationSummaries,
  pricingSummary,
  keypairDownloads,
  instances,
  instancesPageUrl,
  onCreateAnother,
  resourceLabel = "Instance",
}) => {
  const { apiBaseUrl, authHeaders, isAuthenticated } = useApiContext();
  const resourceLabelPlural = resourceLabel.toLowerCase().endsWith("s")
    ? resourceLabel
    : `${resourceLabel}s`;
  const resolvedCurrency = pricingSummary?.currency || "USD";
  const resolvedTotal = pricingSummary?.grandTotal ?? 0;
  const totalInstances = configurationSummaries.reduce((total, cfg) => {
    const countValue = Number(cfg.count ?? 1);
    return total + (Number.isFinite(countValue) ? countValue : 1);
  }, 0);
  const sanitizedDownloads = useMemo(
    () => (keypairDownloads || []).filter((item) => item && item.name && item.material),
    [keypairDownloads]
  );
  const [showKeypairModal, setShowKeypairModal] = useState(false);
  const [downloadedKeys, setDownloadedKeys] = useState<string[]>([]);
  const [emailingKeys, setEmailingKeys] = useState<string[]>([]);
  const [isRetryingHealthCheck, setIsRetryingHealthCheck] = useState(false);
  const [instanceProgress, setInstanceProgress] = useState<Record<string, PipelineStep[]>>({});
  const instanceRefs = useMemo(() => {
    if (!Array.isArray(instances)) return [];
    return instances
      .map((instance: any) => {
        const key = resolveInstanceKey(instance);
        const lookupId = resolveInstanceLookupId(instance);
        const broadcastId = normalizeText(instance?.id);
        if (!key || !lookupId) return null;
        return { key, lookupId, broadcastId };
      })
      .filter(Boolean);
  }, [instances]);
  const instanceIds = useMemo(
    () => instanceRefs.map((ref: any) => ref.broadcastId).filter((id: string) => id !== ""),
    [instanceRefs]
  );

  useEffect(() => {
    if (!Array.isArray(instances) || instances.length === 0) {
      setInstanceProgress({});
      return;
    }

    const next: Record<string, PipelineStep[]> = {};
    instances.forEach((instance: any) => {
      const id = resolveInstanceKey(instance);
      if (!id) return;
      const steps = Array.isArray(instance?.provisioning_progress)
        ? instance.provisioning_progress
        : [];
      next[String(id)] = steps.map((step: any) => ({
        id: step.id || step.key || step.label || "",
        label: step.label || "Step",
        status: normalizeStatus(step.status),
        description: step.description,
        updated_at: step.updated_at,
        context: step.context,
      }));
    });
    setInstanceProgress(next);
  }, [instances]);

  const handleInstanceUpdate = useCallback((event: any) => {
    const instanceId = event?.instance_id || event?.instance?.id;
    const step = event?.step;
    if (!instanceId || !step) return;

    setInstanceProgress((prev) => {
      const key = String(instanceId);
      const existing = Array.isArray(prev[key]) ? [...prev[key]] : [];
      const normalizedStep = {
        id: step.id || step.key || step.label || "",
        label: step.label || "Step",
        status: normalizeStatus(step.status),
        description: step.description,
        updated_at: step.updated_at || new Date().toISOString(),
        context: step.context,
      };
      const stepIndex = existing.findIndex((item) => item.id === normalizedStep.id);
      if (stepIndex > -1) {
        existing[stepIndex] = { ...existing[stepIndex], ...normalizedStep };
      } else {
        existing.push(normalizedStep);
      }

      return {
        ...prev,
        [key]: existing,
      };
    });
  }, []);

  useInstanceBroadcasting(instanceIds, handleInstanceUpdate);

  const fetchProgress = useCallback(
    async (refs = instanceRefs) => {
      if (!Array.isArray(refs) || refs.length === 0) return;

      for (const ref of refs) {
        try {
          const response = await fetch(`${apiBaseUrl}/instances/${ref.lookupId}`, {
            headers: authHeaders,
            credentials: "include",
          });
          if (!response.ok) continue;
          const data = await response.json();
          const instance = data.data || data;
          const steps = Array.isArray(instance?.provisioning_progress)
            ? instance.provisioning_progress
            : [];
          if (steps.length > 0) {
            setInstanceProgress((prev) => ({
              ...prev,
              [String(ref.key)]: steps.map((step: any) => ({
                id: step.id || step.key || step.label || "",
                label: step.label || "Step",
                status: normalizeStatus(step.status),
                description: step.description,
                updated_at: step.updated_at,
                context: step.context,
              })),
            }));
          }
        } catch (err) {
          console.warn(`Failed to fetch progress for instance ${ref.lookupId}`, err);
        }
      }
    },
    [apiBaseUrl, authHeaders, instanceRefs]
  );

  // Polling fallback: fetch progress from API every 3 seconds
  useEffect(() => {
    if (!isAuthenticated || instanceRefs.length === 0) return;

    // Initial fetch
    fetchProgress();

    // Poll every 3 seconds while instances are provisioning
    const interval = setInterval(() => {
      // Check if all instances are complete or failed - stop polling
      const allDone = Object.values(instanceProgress).every((steps) => {
        if (!Array.isArray(steps) || steps.length === 0) return false;
        return steps.every((s) => s.status === "completed" || s.status === "failed");
      });
      if (allDone && Object.keys(instanceProgress).length > 0) {
        clearInterval(interval);
        return;
      }
      fetchProgress();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchProgress, isAuthenticated, instanceProgress, instanceRefs.length]);

  const resolveLookupIds = useCallback(
    (keys: string[]) => {
      return keys
        .map((key) => instanceRefs.find((ref: any) => ref.key === key)?.lookupId)
        .filter((id: string | undefined): id is string => Boolean(id));
    },
    [instanceRefs]
  );

  const handleRetryHealthCheck = useCallback(
    async (keys: string[]) => {
      if (!isAuthenticated) {
        ToastUtils.error("Sign in to retry health checks.");
        return;
      }

      const lookupIds = resolveLookupIds(keys);
      if (lookupIds.length === 0) {
        ToastUtils.error("No instances available to refresh.");
        return;
      }

      setIsRetryingHealthCheck(true);
      try {
        const results = await Promise.allSettled(
          lookupIds.map(async (lookupId) => {
            const response = await fetch(
              `${apiBaseUrl}/instance-management/${lookupId}/refresh-status`,
              {
                method: "POST",
                headers: authHeaders,
                credentials: "include",
              }
            );

            if (!response.ok) {
              const data = await response.json().catch(() => ({}));
              throw new Error(data?.message || "Failed to refresh instance status.");
            }
          })
        );

        const failures = results.filter((result) => result.status === "rejected");
        if (failures.length > 0) {
          console.error("Health check refresh failures:", failures);
          ToastUtils.error(`Failed to refresh ${failures.length} instance(s).`);
        } else {
          ToastUtils.success("Health check refresh triggered.");
        }

        await fetchProgress();
      } finally {
        setIsRetryingHealthCheck(false);
      }
    },
    [apiBaseUrl, authHeaders, fetchProgress, isAuthenticated, resolveLookupIds]
  );

  const instancePipelineSkeleton = useMemo(() => {
    const firstWithSteps = Object.values(instanceProgress).find(
      (steps) => Array.isArray(steps) && steps.length > 0
    );
    if (!Array.isArray(firstWithSteps) || firstWithSteps.length === 0) {
      return DEFAULT_INSTANCE_PIPELINE;
    }

    const defaults = DEFAULT_INSTANCE_PIPELINE.map((step) => {
      const match = firstWithSteps.find((item) => item.id === step.id);
      return {
        ...step,
        label: match?.label || step.label,
        description: match?.description || step.description,
      };
    });
    const defaultIds = new Set(defaults.map((step) => step.id));
    const extras = firstWithSteps
      .filter((step) => step.id && !defaultIds.has(step.id))
      .map((step) => ({
        id: step.id,
        label: step.label,
        status: "not_started" as const,
        description: step.description,
      }));

    return [...defaults, ...extras];
  }, [instanceProgress]);

  const buildAggregatedSteps = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        return instancePipelineSkeleton;
      }

      return instancePipelineSkeleton.map((step) => {
        const stepUpdates = ids
          .map((id) => {
            const steps = instanceProgress[id] || [];
            return steps.find((item) => item.id === step.id);
          })
          .filter(Boolean) as PipelineStep[];

        const completedCount = stepUpdates.filter((item) => item.status === "completed").length;
        const failedCount = stepUpdates.filter((item) => item.status === "failed").length;
        const pendingCount = stepUpdates.filter((item) => item.status === "pending").length;

        let status: PipelineStep["status"] = "not_started";
        if (failedCount > 0) {
          status = "failed";
        } else if (completedCount === ids.length) {
          status = "completed";
        } else if (pendingCount > 0 || completedCount > 0) {
          status = "pending";
        }

        const updatedAt = stepUpdates.reduce<string | undefined>((latest, current) => {
          if (!current?.updated_at) return latest;
          if (!latest) return current.updated_at;
          return new Date(current.updated_at).getTime() > new Date(latest).getTime()
            ? current.updated_at
            : latest;
        }, step.updated_at);

        const description =
          failedCount > 0
            ? `${failedCount}/${ids.length} failed`
            : `${completedCount}/${ids.length} complete`;

        return {
          ...step,
          status,
          updated_at: updatedAt,
          description: step.description ? `${step.description} - ${description}` : description,
        };
      });
    },
    [instancePipelineSkeleton, instanceProgress]
  );

  const filterPipelineSteps = useCallback(
    (
      steps: PipelineStep[],
      requirements: { requiresElasticIp: boolean; requiresDataVolumes: boolean }
    ) => {
      return steps.filter((step) => {
        if (step.id === "allocate_elastic_ip" && !requirements.requiresElasticIp) {
          return false;
        }
        if (step.id === "attach_data_volumes" && !requirements.requiresDataVolumes) {
          return false;
        }
        return true;
      });
    },
    []
  );

  const configurationGroups = useMemo<ConfigurationPipelineGroup[]>(() => {
    if (!Array.isArray(instances) || instances.length === 0) return [];

    const groups = new Map<string, ConfigurationPipelineGroup & { monthsValues: number[] }>();

    instances.forEach((instance: any) => {
      const key = buildConfigurationKey(instance);
      const { title, subtitle, monthsValue } = buildConfigurationLabel(instance);
      const instanceId = resolveInstanceKey(instance);
      if (!instanceId) return;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          title,
          subtitle,
          termLabel: "",
          instanceIds: [],
          instanceCount: 0,
          instanceSummaries: [],
          requiresElasticIp: false,
          requiresDataVolumes: false,
          monthsValues: [],
        });
      }

      const group = groups.get(key);
      if (!group) return;

      const displayIdentifier =
        normalizeText(instance?.identifier) || normalizeText(instance?.id) || instanceId;
      const displayName = resolveInstanceName(instance, group.instanceSummaries.length + 1);

      group.instanceIds.push(instanceId);
      group.instanceSummaries.push({
        key: instanceId,
        name: displayName,
        identifier: displayIdentifier,
      });
      group.instanceCount = group.instanceIds.length;
      if (hasElasticIp(instance)) {
        group.requiresElasticIp = true;
      }
      if (hasDataVolumes(instance)) {
        group.requiresDataVolumes = true;
      }
      if (monthsValue !== null) {
        group.monthsValues.push(monthsValue);
      }
    });

    return Array.from(groups.values()).map((group) => {
      const uniqueMonths = Array.from(new Set(group.monthsValues));
      const termLabel =
        uniqueMonths.length === 1
          ? `${uniqueMonths[0]} months`
          : uniqueMonths.length > 1
            ? "Mixed terms"
            : "N/A";
      return {
        key: group.key,
        title: group.title,
        subtitle: group.subtitle,
        termLabel,
        instanceIds: group.instanceIds,
        instanceCount: group.instanceCount,
        instanceSummaries: group.instanceSummaries,
        requiresElasticIp: group.requiresElasticIp,
        requiresDataVolumes: group.requiresDataVolumes,
      };
    });
  }, [instances]);

  const configurationPipelines = useMemo(
    () =>
      configurationGroups.map((group) => ({
        ...group,
        steps: filterPipelineSteps(buildAggregatedSteps(group.instanceIds), {
          requiresElasticIp: group.requiresElasticIp,
          requiresDataVolumes: group.requiresDataVolumes,
        }),
      })),
    [buildAggregatedSteps, configurationGroups, filterPipelineSteps]
  );

  useEffect(() => {
    if (sanitizedDownloads.length > 0) {
      setShowKeypairModal(true);
    }
  }, [sanitizedDownloads.length]);

  const downloadPrivateKey = (material: string, name: string) => {
    const blob = new Blob([material], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name.replace(/[^a-zA-Z0-9-_]/g, "_") || "keypair"}.pem`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setDownloadedKeys((prev) => [...prev, name]);
  };

  const sendKeypairEmail = useCallback(
    async (keypairId?: string | number, keyLabel?: string) => {
      if (!keypairId) {
        ToastUtils.error("Key pair ID is missing. Unable to email the key.");
        return;
      }
      if (!isAuthenticated) {
        ToastUtils.error("Sign in to email the key pair.");
        return;
      }

      const id = String(keypairId);
      setEmailingKeys((prev) => [...prev, id]);
      try {
        const response = await fetch(`${apiBaseUrl}/key-pairs/${id}/email`, {
          method: "POST",
          headers: authHeaders,
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || "Failed to email key pair.");
        }

        ToastUtils.success(
          payload?.message || `Key pair ${keyLabel ? `"${keyLabel}" ` : ""}emailed successfully.`
        );
      } catch (error: any) {
        ToastUtils.error(error?.message || "Could not email the key pair.");
      } finally {
        setEmailingKeys((prev) => prev.filter((item) => item !== id));
      }
    },
    [apiBaseUrl, authHeaders, isAuthenticated]
  );

  return (
    <div className="space-y-6">
      <ModernModal
        isOpen={showKeypairModal}
        onClose={() => setShowKeypairModal(false)}
        title="Download your private key"
        subtitle="Store this .pem file securely. You will not be able to retrieve it later."
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            These key pairs were generated during provisioning. Download each private key and keep
            it safe.
          </p>
          {sanitizedDownloads.length === 0 ? (
            <p className="text-sm text-gray-500">No key pairs to download.</p>
          ) : (
            <div className="space-y-3">
              {sanitizedDownloads.map((item) => {
                const keyLabel = item.name || "keypair";
                const contextLabel = [item.project_name, item.region].filter(Boolean).join(" • ");
                const hasDownloaded = downloadedKeys.includes(keyLabel);
                const emailKey = item.id !== undefined && item.id !== null ? String(item.id) : "";
                const isEmailing = emailKey ? emailingKeys.includes(emailKey) : false;
                return (
                  <div
                    key={`${item.id || keyLabel}-${contextLabel}`}
                    className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{keyLabel}</p>
                        {contextLabel ? (
                          <p className="text-xs text-gray-500">{contextLabel}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ModernButton
                          variant="outline"
                          size="sm"
                          onClick={() => downloadPrivateKey(item.material, keyLabel)}
                          isDisabled={hasDownloaded}
                        >
                          {hasDownloaded ? "Downloaded" : "Download .pem"}
                        </ModernButton>
                        <ModernButton
                          variant="outline"
                          size="sm"
                          onClick={() => sendKeypairEmail(item.id, keyLabel)}
                          isDisabled={!emailKey || isEmailing}
                        >
                          {isEmailing ? "Emailing..." : "Email .pem"}
                        </ModernButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ModernModal>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isFastTrack ? `${resourceLabelPlural} Provisioning!` : "Order Confirmed!"}
            </h2>
            <p className="text-gray-500">
              {isFastTrack
                ? `Your ${resourceLabelPlural.toLowerCase()} are being deployed immediately`
                : `Your ${resourceLabelPlural.toLowerCase()} are being provisioned`}
            </p>
          </div>
        </div>

        {/* Order ID Banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-800">
            <strong>Order ID:</strong> {orderId || "—"}
          </p>
          {transactionId && (
            <p className="text-sm text-green-800 mt-1">
              <strong>Transaction:</strong> {transactionId}
            </p>
          )}
          <p className="text-sm text-green-700 mt-1">
            You will receive an email confirmation shortly.
          </p>
        </div>

        {/* Order Summary */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-semibold text-gray-800 mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            {configurationSummaries.map((cfg) => {
              const displayName = cfg.name || cfg.title || resourceLabel;
              const displayRegion = cfg.region || cfg.regionLabel || "—";
              const countValue = Number(cfg.count ?? 1);
              const monthsValue = Number(cfg.months ?? 1);
              const countLabel = Number.isFinite(countValue) ? countValue : cfg.count || 1;
              const monthsLabel = Number.isFinite(monthsValue) ? monthsValue : cfg.months || 1;

              return (
                <div key={cfg.id} className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {displayName} × {countLabel} ({monthsLabel} months)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800 font-medium">{displayRegion}</span>
                    {cfg.canFastTrack && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        Fast-track
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between text-gray-600">
              <span>Total {resourceLabelPlural.toLowerCase()}</span>
              <span className="font-medium text-gray-800">{totalInstances || 0}</span>
            </div>

            {/* Total */}
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-green-600">
                {isFastTrack
                  ? "Free (Fast-track)"
                  : `${resolvedCurrency} ${resolvedTotal.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-6">
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-800">Order status</h3>
              <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">Order confirmed</p>
                    <p className="text-xs text-gray-500">
                      Request accepted and queued for processing.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">
                      {isFastTrack ? "Fast-track approved" : "Payment verified"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isFastTrack
                        ? "Fast-track authorization granted for provisioning."
                        : "Payment confirmed and released to provisioning."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">
                  Provisioning pipeline by configuration
                </h3>
                <span className="text-xs text-gray-500">
                  {configurationPipelines.length} configuration
                  {configurationPipelines.length === 1 ? "" : "s"}
                </span>
              </div>
              {configurationPipelines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                  Provisioning steps will appear once instances are created.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {configurationPipelines.map((group) => (
                    <div key={group.key} className="flex flex-col gap-3">
                      <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{group.title}</p>
                            <p className="text-xs text-gray-500">{group.subtitle}</p>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <p>
                              {group.instanceCount} instance{group.instanceCount === 1 ? "" : "s"}
                            </p>
                            <p>Term: {group.termLabel}</p>
                          </div>
                        </div>
                        {group.instanceSummaries.length > 0 && (
                          <div className="mt-2 space-y-1 text-xs text-gray-500">
                            {group.instanceSummaries.map((item) => (
                              <div key={item.key} className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-gray-700">{item.name}</span>
                                <span className="font-mono text-gray-500">({item.identifier})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <SetupProgressCard steps={group.steps} isLoading={false} />
                      {group.steps.some(
                        (step) =>
                          (step.id === "wait_for_active" || step.id === "instance_ready") &&
                          step.status === "failed"
                      ) && (
                        <ModernButton
                          variant="outline"
                          onClick={() => handleRetryHealthCheck(group.instanceIds)}
                          disabled={isRetryingHealthCheck}
                        >
                          {isRetryingHealthCheck ? "Retrying..." : "Retry Health Check"}
                        </ModernButton>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <ModernButton
            onClick={() => (window.location.href = instancesPageUrl)}
            className="flex-1"
          >
            View My Instances
          </ModernButton>
          <ModernButton variant="outline" onClick={onCreateAnother}>
            Create Another
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessStep;
