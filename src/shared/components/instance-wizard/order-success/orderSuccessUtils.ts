import type { ApiContext } from "@/hooks/useApiContext";
import type { PipelineStep, ConfigurationPipelineGroup } from "./OrderSuccessStep.types";

export const normalizeStatus = (status?: string | null): PipelineStep["status"] => {
  const normalized = String(status || "").toLowerCase();
  if (["completed", "complete", "done", "success"].includes(normalized)) return "completed";
  if (["pending", "processing", "queued", "running", "in_progress"].includes(normalized))
    return "pending";
  if (["failed", "error"].includes(normalized)) return "failed";
  return "not_started";
};

export const normalizeText = (value?: string | number | null): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

export const resolveInstanceKey = (instance: any): string => {
  const id = instance?.id;
  if (id !== null && id !== undefined) {
    const normalized = normalizeText(id);
    if (normalized) return normalized;
  }

  const identifier = normalizeText(instance?.identifier);
  if (identifier) return identifier;

  return "";
};

export const resolveInstanceLookupId = (instance: any): string => {
  const identifier = normalizeText(instance?.identifier);
  if (identifier) return identifier;

  const id = instance?.id;
  if (id !== null && id !== undefined) {
    const normalized = normalizeText(id);
    if (normalized) return normalized;
  }

  return "";
};

export const resolveInstanceName = (instance: any, fallbackIndex?: number): string => {
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

export const resolveAdditionalVolumes = (instance: any): any[] => {
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

export const normalizeVolumeEntry = (volume: any) => {
  if (!volume) return null;
  const typeId = normalizeText(volume.volume_type_id ?? volume.id ?? volume.type_id ?? "");
  const name = normalizeText(volume.name ?? "");
  const size = normalizeText(volume.storage_size_gb ?? volume.size_gb ?? volume.size ?? "");
  if (!typeId && !name && !size) return null;
  return { typeId, name, size };
};

export const hasElasticIp = (instance: any): boolean => {
  const countValue = Number(
    instance?.floating_ip_count ?? instance?.configuration?.floating_ip_count ?? 0
  );
  return Number.isFinite(countValue) && countValue > 0;
};

export const hasDataVolumes = (instance: any): boolean => {
  const volumes = resolveAdditionalVolumes(instance);
  return volumes.some((volume) => Boolean(normalizeVolumeEntry(volume)));
};

export const formatVolumeEntry = (entry: { typeId: string; name: string; size: string }) => {
  const labelBase = entry.name || (entry.typeId ? `Volume ${entry.typeId}` : "Volume");
  const sizeLabel = entry.size ? `${entry.size}GB` : "";
  return [labelBase, sizeLabel].filter(Boolean).join(" ");
};

export const buildVolumeSummary = (primary: any, additional: any[]) => {
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

export const buildConfigurationKey = (instance: any) => {
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

export const buildConfigurationLabel = (instance: any) => {
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

export const getContextPrefix = (context: ApiContext) => {
  if (context === "tenant") return "/admin";
  if (context === "client") return "/business";
  return "";
};

/**
 * Build configuration pipeline groups from a list of instances.
 */
export const buildConfigurationGroups = (instances: unknown): ConfigurationPipelineGroup[] => {
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
};

/**
 * Build instance refs from a raw instances array.
 */
export const buildInstanceRefs = (instances: unknown) => {
  if (!Array.isArray(instances)) return [];
  return instances
    .map((instance: any) => {
      const key = resolveInstanceKey(instance);
      const lookupId = resolveInstanceLookupId(instance);
      const broadcastId = normalizeText(instance?.id);
      if (!key || !lookupId) return null;
      return { key, lookupId, broadcastId };
    })
    .filter(Boolean) as { key: string; lookupId: string; broadcastId: string }[];
};
