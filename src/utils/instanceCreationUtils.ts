import { Configuration, Option } from "../types/InstanceConfiguration";

export const COUNTRY_FALLBACK = [{ value: "US", label: "United States (US)", currency: "USD" }];

/**
 * Normalizes a country value to a 2-letter ISO code
 */
export const normalizeCountryCandidate = (value: any): string => {
  if (value === null || value === undefined) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) {
    return upper;
  }
  return "";
};

/**
 * Matches a country value against available options
 */
export const matchCountryFromOptions = (value: any, options: Option[] = []): string => {
  if (value === null || value === undefined) return "";
  const normalized = normalizeCountryCandidate(value);
  if (normalized) return normalized;

  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();

  const match = options.find((option) => {
    if (!option) return false;
    if (typeof option.value === "string" && option.value.toLowerCase() === lower) {
      return true;
    }
    if (typeof option.label === "string") {
      const labelLower = option.label.toLowerCase();
      if (labelLower === lower) {
        return true;
      }
      const bracketIndex = option.label.indexOf("(");
      if (bracketIndex >= 0) {
        const prefix = option.label.slice(0, bracketIndex).trim().toLowerCase();
        if (prefix === lower) {
          return true;
        }
      }
    }
    return false;
  });

  return match?.value ? String(match.value).toUpperCase() : "";
};

/**
 * Resolves country code from various entity properties
 */
export const resolveCountryCodeFromEntity = (entity: any, options: Option[] = []): string => {
  if (!entity) return "";
  const candidates = [
    entity.country_code,
    entity.countryCode,
    entity.country_iso,
    entity.countryIso,
    entity.country,
    entity.billing_country_code,
    entity.billingCountryCode,
    entity.billing_country,
    entity.billingCountry,
    entity.billing?.country_code,
    entity.billing?.countryCode,
    entity.billing?.country,
    entity.location?.country_code,
    entity.location?.countryCode,
    entity.address?.country_code,
    entity.address?.countryCode,
    entity.profile?.country_code,
    entity.profile?.countryCode,
    entity.metadata?.country_code,
    entity.metadata?.countryCode,
    entity.primary_contact?.country_code,
    entity.primary_contact?.countryCode,
    entity.contact?.country_code,
    entity.contact?.countryCode,
    entity.tenant_country_code,
    entity.tenant_country,
    entity.tenant?.country_code,
    entity.tenant?.country,
    entity.settings?.country_code,
    entity.settings?.country,
  ];

  for (const candidate of candidates) {
    const code = matchCountryFromOptions(candidate, options);
    if (code) {
      return code;
    }
  }
  return "";
};

/**
 * Checks if a value is not null/undefined/empty
 */
export const hasValue = (value: any) =>
  value !== null && value !== undefined && String(value).trim() !== "";

/**
 * Evaluates if a configuration is complete
 */
export const evaluateConfigurationCompleteness = (cfg: Configuration) => {
  const missing: string[] = [];
  if (!hasValue(cfg.region)) missing.push("Region");
  if (!Number(cfg.instance_count)) missing.push("Instance count");
  if (!Number(cfg.months)) missing.push("Duration");
  const requiresProject = cfg.project_mode === "new" || Boolean(cfg.template_locked);
  if (requiresProject) {
    if (!hasValue(cfg.project_name)) missing.push("Project name");
    if (!hasValue(cfg.network_preset) || cfg.network_preset === "empty") {
      missing.push("Network preset");
    }
  } else if (!hasValue(cfg.project_id)) {
    missing.push("Project");
  }
  if (!hasValue(cfg.compute_instance_id)) missing.push("Instance type");
  if (!hasValue(cfg.os_image_id)) missing.push("OS image");
  if (!hasValue(cfg.volume_type_id)) missing.push("Boot volume type");
  if (!Number(cfg.storage_size_gb)) missing.push("Boot volume size");
  return { isComplete: missing.length === 0, missing };
};

/**
 * Normalizes payment options from various formats
 */
export const normalizePaymentOptions = (options: any): any[] => {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return normalizePaymentOptions(parsed);
    } catch (error) {
      return [];
    }
  }
  if (typeof options === "object") {
    if (Array.isArray(options.payment_gateway_options)) {
      return options.payment_gateway_options;
    }
    if (Array.isArray(options.options)) {
      return options.options;
    }
    return [options];
  }
  return [];
};

/**
 * Formats a number as currency with 2 decimal places
 */
export const formatCurrencyValue = (amount: any) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return "0.00";
  }
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Finds a label from a collection by ID
 */
export const findLabel = (collection: any[], id: string, fallbackPrefix?: string) => {
  if (!id) return "Not selected";
  const match = collection.find((item) => {
    const candidates = [
      item.id,
      item.identifier,
      item.name,
      item.code,
      item.slug,
      item.productable_id,
      item.productable?.id,
      item.productable?.identifier,
      item.productable?.name,
    ]
      .map((value) => (value ?? "").toString())
      .filter(Boolean);
    return candidates.some((candidate) => candidate === String(id));
  });
  if (!match) return fallbackPrefix ? `${fallbackPrefix} selected` : "Selected";
  return (
    match.name ||
    match.label ||
    match.productable?.name ||
    (fallbackPrefix ? `${fallbackPrefix} selected` : "Selected")
  );
};

/**
 * Formats compute instance label with specs
 */
export const formatComputeLabel = (id: string, instanceTypes: any[]) => {
  const match = instanceTypes.find((item) => {
    const candidates = [
      item.id,
      item.identifier,
      item.name,
      item.code,
      item.slug,
      item.productable_id,
      item.productable?.id,
      item.productable?.identifier,
      item.productable?.name,
    ]
      .map((value) => (value ?? "").toString())
      .filter(Boolean);
    return candidates.some((candidate) => candidate === String(id));
  });
  if (!match) return id ? "Instance selected" : "Not selected";
  const memoryGb = match.memory_mb ? Math.round(Number(match.memory_mb) / 1024) : match.memory_gb;
  const meta = [];
  if (match.vcpus) meta.push(`${match.vcpus} vCPU`);
  if (memoryGb) meta.push(`${memoryGb} GB RAM`);
  const baseName = match.name || match.productable?.name || "Instance selected";
  return meta.length ? `${baseName} • ${meta.join(" • ")}` : baseName;
};

/**
 * Formats OS image label
 */
export const formatOsLabel = (id: string, osImages: any[]) => findLabel(osImages, id, "OS");

/**
 * Formats volume label with size
 */
export const formatVolumeLabel = (id: string, size: number | string, volumeTypes: any[]) => {
  if (!id) return "Volume not selected";
  const match = volumeTypes.find((item) => {
    const candidates = [
      item.id,
      item.identifier,
      item.name,
      item.code,
      item.slug,
      item.productable_id,
      item.productable?.id,
      item.productable?.identifier,
      item.productable?.name,
    ]
      .map((value) => (value ?? "").toString())
      .filter(Boolean);
    return candidates.some((candidate) => candidate === String(id));
  });
  const label = match?.name || match?.productable?.name || "Volume selected";
  return size ? `${label} • ${size} GB` : label;
};

/**
 * Formats keypair label
 */
export const formatKeypairLabel = (value: string, keyPairs: any[], explicitLabel = "") => {
  if (explicitLabel) return explicitLabel;
  if (!value) return "No key pair";
  const match = keyPairs.find((kp) => {
    const candidate = kp.name || kp.id;
    return candidate && String(candidate) === String(value);
  });
  return match?.name || match?.label || value || "No key pair";
};

/**
 * Formats subnet label
 */
export const formatSubnetLabel = (cfg: Configuration) => {
  if (cfg.subnet_label) return cfg.subnet_label;
  if (!cfg.subnet_id) return "Default subnet";
  return "Subnet selected";
};

/**
 * Converts value to number safely
 */
export const toNumber = (value: any) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeTemplateIdList = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => item?.value ?? item?.id ?? item?.identifier ?? item)
      .map((item) => (item ?? "").toString().trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "number") {
    return [String(value)];
  }
  return [];
};

const pickDefined = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const buildTemplateVolume = (volume: any, index: number) => ({
  id: volume?.id || `tmpl_${index}_${Math.random().toString(36).slice(2, 8)}`,
  volume_type_id: pickDefined(volume?.volume_type_id, volume?.id, volume?.identifier) || "",
  storage_size_gb: pickDefined(volume?.storage_size_gb, volume?.size_gb, volume?.size) || 0,
});

export const buildConfigurationFromTemplate = (template: any): Partial<Configuration> => {
  const config = template?.configuration || {};
  const patch: Partial<Configuration> = {};

  const templateId = template?.id || template?.identifier;
  if (templateId) patch.template_id = String(templateId);
  if (template?.name) patch.template_name = String(template.name);
  patch.template_locked = true;
  patch.project_mode = "new";
  patch.project_id = "";
  const uniqueSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const baseProjectName = pickDefined(config.project_name, template?.name, "Template");
  const normalizedBase = String(baseProjectName || "Template").trim() || "Template";
  patch.project_name = normalizedBase.toLowerCase().includes("project")
    ? `${normalizedBase} ${uniqueSuffix}`
    : `${normalizedBase} Project ${uniqueSuffix}`;

  const region = pickDefined(config.region, config.region_code, config.location);
  if (region) patch.region = String(region);

  const instanceCount = pickDefined(
    config.instance_count,
    config.number_of_instances,
    config.quantity
  );
  if (instanceCount !== undefined) patch.instance_count = instanceCount;

  const months = pickDefined(config.months, config.term_months, config.billing_months);
  if (months !== undefined) patch.months = months;

  const computeId = pickDefined(
    config.compute_instance_id,
    config.compute?.instance_type_id,
    config.compute?.id,
    config.compute?.instance_id
  );
  if (computeId) patch.compute_instance_id = String(computeId);

  const osImageId = pickDefined(
    config.os_image_id,
    config.os_image?.os_image_id,
    config.os_image?.id,
    config.os_image?.identifier
  );
  if (osImageId) patch.os_image_id = String(osImageId);

  const rawVolumeEntries = Array.isArray(config.volume_types)
    ? config.volume_types
    : Array.isArray(config.volumes)
      ? config.volumes
      : [];
  const primaryVolume = rawVolumeEntries[0] || {};

  const volumeTypeId = pickDefined(
    config.volume_type_id,
    primaryVolume.volume_type_id,
    primaryVolume.id,
    primaryVolume.identifier
  );
  if (volumeTypeId) patch.volume_type_id = String(volumeTypeId);

  const storageSize = pickDefined(
    config.storage_size_gb,
    primaryVolume.storage_size_gb,
    primaryVolume.size_gb,
    primaryVolume.size
  );
  if (storageSize !== undefined) patch.storage_size_gb = storageSize;

  const bandwidthId = pickDefined(
    config.bandwidth_id,
    config.networking?.bandwidth_id,
    config.networking?.bandwidth?.id
  );
  if (bandwidthId) patch.bandwidth_id = String(bandwidthId);

  const bandwidthCount = pickDefined(config.bandwidth_count, config.networking?.bandwidth_count);
  if (bandwidthCount !== undefined) patch.bandwidth_count = bandwidthCount;

  const floatingIpCount = pickDefined(
    config.floating_ip_count,
    config.networking?.floating_ip_count
  );
  if (floatingIpCount !== undefined) patch.floating_ip_count = floatingIpCount;

  const securityGroups = pickDefined(
    config.security_group_ids,
    config.security_groups,
    config.networking?.security_group_ids,
    config.networking?.security_groups
  );
  const normalizedSecurityGroups = normalizeTemplateIdList(securityGroups);
  if (normalizedSecurityGroups.length > 0) patch.security_group_ids = normalizedSecurityGroups;

  const keypairName = pickDefined(
    config.keypair_name,
    config.keypair?.name,
    config.auth?.keypair_name
  );
  if (keypairName) patch.keypair_name = String(keypairName);

  const networkId = pickDefined(config.network_id, config.networking?.network_id, config.vpc_id);
  if (networkId) patch.network_id = String(networkId);

  const subnetId = pickDefined(config.subnet_id, config.networking?.subnet_id, config.subnet?.id);
  if (subnetId) patch.subnet_id = String(subnetId);

  const tags = pickDefined(config.tags, config.tag_list, config.networking?.tags);
  if (Array.isArray(tags)) {
    patch.tags = tags.join(",");
  } else if (tags) {
    patch.tags = String(tags);
  }

  const networkPreset = pickDefined(
    config.network_preset,
    config.metadata?.network_preset,
    config.networking?.preset
  );
  const normalizedPreset = networkPreset ? String(networkPreset) : "standard";
  patch.network_preset = normalizedPreset === "empty" ? "standard" : normalizedPreset;

  if (patch.project_mode === "new") {
    patch.network_id = "";
    patch.subnet_id = "";
    patch.security_group_ids = [];
  }

  const existingAdditionalVolumes = Array.isArray(config.additional_volumes)
    ? config.additional_volumes.map(buildTemplateVolume)
    : [];
  if (existingAdditionalVolumes.length > 0) {
    patch.additional_volumes = existingAdditionalVolumes;
  } else if (rawVolumeEntries.length > 1) {
    patch.additional_volumes = rawVolumeEntries.slice(1).map(buildTemplateVolume);
  }

  return patch;
};

export const hasProjectNetworkFromStatus = (status: any, project?: any): boolean => {
  const projectStatus = status?.project || status?.data?.project || status || {};

  if (projectStatus?.vpc_enabled || project?.vpc_enabled) return true;

  const summary = Array.isArray(projectStatus?.summary) ? projectStatus.summary : [];
  const summaryHasVpc = summary.some(
    (item) =>
      item?.completed && typeof item?.title === "string" && item.title.toLowerCase().includes("vpc")
  );
  if (summaryHasVpc) return true;

  const progress = projectStatus?.provisioning_progress;
  if (progress?.vpc_enabled) return true;

  const progressSteps = Array.isArray(progress?.steps)
    ? progress.steps
    : Array.isArray(progress)
      ? progress
      : [];
  return progressSteps.some((step: any) => {
    const key = String(step?.key || step?.id || step?.label || "").toLowerCase();
    const statusValue = String(step?.status || "").toLowerCase();
    return key.includes("vpc") && (step?.completed === true || statusValue === "completed");
  });
};
