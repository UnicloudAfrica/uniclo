import type { ApiContext } from "@/hooks/useApiContext";
import type { PipelineStep, ConfigurationPipelineGroup } from "./OrderSuccessStep.types";

type UnknownInstance = Record<string, unknown> | null | undefined;
type UnknownVolume = Record<string, unknown> | null | undefined;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};


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

export const resolveInstanceKey = (instance: UnknownInstance): string => {
  const id = (instance as Record<string, unknown>)?.id as string | number | null | undefined;
  if (id !== null && id !== undefined) {
    const normalized = normalizeText(id as string | number);
    if (normalized) return normalized;
  }

  const identifier = normalizeText((instance as Record<string, unknown>)?.identifier as string | number | null | undefined);
  if (identifier) return identifier;

  return "";
};

export const resolveInstanceLookupId = (instance: UnknownInstance): string => {
  const rec = asRecord(instance);
  const identifier = normalizeText(rec.identifier as string | number | null | undefined);
  if (identifier) return identifier;

  const id = rec.id as string | number | null | undefined;
  if (id !== null && id !== undefined) {
    const normalized = normalizeText(id);
    if (normalized) return normalized;
  }

  return "";
};

export const resolveInstanceName = (instance: UnknownInstance, fallbackIndex?: number): string => {
  const rec = asRecord(instance);
  const name = normalizeText(rec.name as string | number | null | undefined);
  if (name) return name;

  const tags = rec.tags;
  if (Array.isArray(tags)) {
    const tag = tags.find(
      (entry: unknown) =>
        normalizeText(asRecord(entry).key as string | number | null | undefined).toLowerCase() ===
        "name"
    );
    const tagValue = normalizeText(asRecord(tag).value as string | number | null | undefined);
    if (tagValue) return tagValue;
  }

  if (Number.isFinite(fallbackIndex)) {
    return `Instance ${fallbackIndex}`;
  }

  return "Instance";
};

export const resolveAdditionalVolumes = (instance: UnknownInstance): unknown[] => {
  const rec = asRecord(instance);
  const configuration = asRecord(rec.configuration);
  const configVolumes = configuration.additional_volumes;
  if (Array.isArray(configVolumes) && configVolumes.length > 0) {
    return configVolumes;
  }

  const metadata = asRecord(rec.metadata);
  const metadataVolumes = metadata.data_volumes ?? metadata.volumes_to_attach;
  if (Array.isArray(metadataVolumes) && metadataVolumes.length > 0) {
    return metadataVolumes;
  }

  const tagVolumes = asRecord(rec.tags).data_volumes;
  if (Array.isArray(tagVolumes) && tagVolumes.length > 0) {
    return tagVolumes;
  }

  return [];
};

export const normalizeVolumeEntry = (volume: UnknownVolume) => {
  if (!volume) return null;
  const v = asRecord(volume);
  const typeId = normalizeText(
    (v.volume_type_id ?? v.id ?? v.type_id ?? "") as string | number | null | undefined
  );
  const name = normalizeText((v.name ?? "") as string | number | null | undefined);
  const size = normalizeText(
    (v.storage_size_gb ?? v.size_gb ?? v.size ?? "") as string | number | null | undefined
  );
  if (!typeId && !name && !size) return null;
  return { typeId, name, size };
};

export const hasElasticIp = (instance: UnknownInstance): boolean => {
  const rec = asRecord(instance);
  const configuration = asRecord(rec.configuration);
  const countValue = Number(rec.floating_ip_count ?? configuration.floating_ip_count ?? 0);
  return Number.isFinite(countValue) && countValue > 0;
};

export const hasDataVolumes = (instance: UnknownInstance): boolean => {
  const volumes = resolveAdditionalVolumes(instance);
  return volumes.some((volume) => Boolean(normalizeVolumeEntry(volume as UnknownVolume)));
};

export const formatVolumeEntry = (entry: { typeId: string; name: string; size: string }) => {
  const labelBase = entry.name || (entry.typeId ? `Volume ${entry.typeId}` : "Volume");
  const sizeLabel = entry.size ? `${entry.size}GB` : "";
  return [labelBase, sizeLabel].filter(Boolean).join(" ");
};

export const buildVolumeSummary = (primary: UnknownVolume, additional: unknown[]) => {
  const primaryEntry = normalizeVolumeEntry(primary);
  const extraEntries = (Array.isArray(additional)
    ? additional.map((v) => normalizeVolumeEntry(v as UnknownVolume)).filter(Boolean)
    : []) as { typeId: string; name: string; size: string }[];

  const primarySignature = primaryEntry
    ? `${primaryEntry.typeId || primaryEntry.name || "primary"}:${primaryEntry.size}`
    : "";
  const extraSignatures = extraEntries
    .map((entry) => `${entry.typeId || entry.name || "extra"}:${entry.size}`)
    .sort();
  const signature =
    [primarySignature, extraSignatures.join("|")].filter(Boolean).join("::") || "volume:none";

  const labelParts: string[] = [];
  if (primaryEntry) {
    labelParts.push(`Primary: ${formatVolumeEntry(primaryEntry)}`);
  }
  if (extraEntries.length > 0) {
    const extras = extraEntries.map((entry) => formatVolumeEntry(entry)).join(", ");
    labelParts.push(`Extra: ${extras}`);
  }
  const label = labelParts.length > 0 ? labelParts.join(" | ") : "N/A";

  return { signature, label };
};

export const buildConfigurationKey = (instance: UnknownInstance) => {
  const rec = asRecord(instance);
  const config = asRecord(rec.configuration);
  const project = asRecord(config.project);
  const compute = asRecord(config.compute);
  const osImage = asRecord(config.os_image);
  const metadata = asRecord(rec.metadata);
  const regionKey = normalizeText(
    (rec.region || config.region || config.regionLabel) as string | number | null | undefined
  );
  const projectKey = normalizeText(
    (project.id || project.identifier || project.name || "") as string | number | null | undefined
  );
  const computeKey = normalizeText(
    (compute.id || compute.name || "") as string | number | null | undefined
  );
  const imageKey = normalizeText(
    (osImage.id || osImage.name || "") as string | number | null | undefined
  );
  const volumeKey = buildVolumeSummary(
    config.primary_volume as UnknownVolume,
    (config.additional_volumes as unknown[]) || []
  ).signature;
  const keypairKey = normalizeText(
    (config.key_name || rec.key_name || metadata.key_name || "") as
      | string
      | number
      | null
      | undefined
  );

  const compositeKey = [regionKey, projectKey, computeKey, imageKey, volumeKey, keypairKey]
    .filter(Boolean)
    .join("||");
  if (compositeKey.length > 0) return compositeKey;
  return `instance:${normalizeText((rec.id || "") as string | number | null | undefined) || Math.random().toString(36)}`;
};

export const buildConfigurationLabel = (instance: UnknownInstance) => {
  const rec = asRecord(instance);
  const config = asRecord(rec.configuration);
  const project = asRecord(config.project);
  const compute = asRecord(config.compute);
  const osImage = asRecord(config.os_image);
  const metadata = asRecord(rec.metadata);
  const regionLabel =
    normalizeText(
      (rec.region || config.regionLabel || config.region) as string | number | null | undefined
    ) || "Region";
  const projectLabel =
    normalizeText((project.name || project.identifier || "") as string | number | null | undefined) ||
    "Project";
  const computeLabel =
    normalizeText((compute.name || compute.id || "") as string | number | null | undefined) ||
    "Compute";
  const imageLabel =
    normalizeText((osImage.name || osImage.id || "") as string | number | null | undefined) ||
    "Image";
  const { label: volumeLabel } = buildVolumeSummary(
    config.primary_volume as UnknownVolume,
    (config.additional_volumes as unknown[]) || []
  );
  const keypairLabel =
    normalizeText(
      (config.key_name || rec.key_name || metadata.key_name || "") as
        | string
        | number
        | null
        | undefined
    ) || "None";
  const monthsValue = Number(config.months ?? rec.months);

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

  instances.forEach((instance: unknown) => {
    const inst = instance as UnknownInstance;
    const rec = asRecord(inst);
    const key = buildConfigurationKey(inst);
    const { title, subtitle, monthsValue } = buildConfigurationLabel(inst);
    const instanceId = resolveInstanceKey(inst);
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
      normalizeText(rec.identifier as string | number | null | undefined) ||
      normalizeText(rec.id as string | number | null | undefined) ||
      instanceId;
    const displayName = resolveInstanceName(inst, group.instanceSummaries.length + 1);

    group.instanceIds.push(instanceId);
    group.instanceSummaries.push({
      key: instanceId,
      name: displayName,
      identifier: displayIdentifier,
    });
    group.instanceCount = group.instanceIds.length;
    if (hasElasticIp(inst)) {
      group.requiresElasticIp = true;
    }
    if (hasDataVolumes(inst)) {
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
    .map((instance: unknown) => {
      const inst = instance as UnknownInstance;
      const key = resolveInstanceKey(inst);
      const lookupId = resolveInstanceLookupId(inst);
      const broadcastId = normalizeText(
        asRecord(inst).id as string | number | null | undefined
      );
      if (!key || !lookupId) return null;
      return { key, lookupId, broadcastId };
    })
    .filter(Boolean) as { key: string; lookupId: string; broadcastId: string }[];
};
