import { AdditionalVolume, Configuration } from "../types/InstanceConfiguration";

type UnknownRecord = Record<string, unknown>;

type ProductableLike = {
  id?: unknown;
  identifier?: unknown;
  name?: unknown;
};

type EntityLike = UnknownRecord & {
  id?: unknown;
  identifier?: unknown;
  name?: unknown;
  label?: unknown;
  code?: unknown;
  slug?: unknown;
  productable_id?: unknown;
  productable?: ProductableLike;
  memory_mb?: unknown;
  memory_gb?: unknown;
  vcpus?: unknown;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const asRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {});

const toStringValue = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

const toNumberValue = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const toNumberOrString = (value: unknown): number | string => {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

export {
  COUNTRY_FALLBACK,
  normalizeCountryCandidate,
  matchCountryFromOptions,
  resolveCountryCodeFromEntity,
} from "../shared/utils/countryUtils";

/**
 * Checks if a value is not null/undefined/empty
 */
export const hasValue = (value: unknown) =>
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
export const normalizePaymentOptions = (options: unknown): unknown[] => {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return normalizePaymentOptions(parsed);
    } catch {
      return [];
    }
  }
  if (isRecord(options)) {
    const gatewayOptions = options["payment_gateway_options"];
    if (Array.isArray(gatewayOptions)) {
      return gatewayOptions;
    }
    const nestedOptions = options["options"];
    if (Array.isArray(nestedOptions)) {
      return nestedOptions;
    }
    return [options];
  }
  return [];
};

/**
 * Picks the default payment option using the same preference order as the payment UI.
 * Card options are preferred, then bank transfer, then the first available gateway.
 */
export const pickPreferredPaymentOption = <
  T extends {
    payment_type?: unknown;
    name?: unknown;
  },
>(
  options: T[] | null | undefined
): T | null => {
  if (!Array.isArray(options) || options.length === 0) {
    return null;
  }

  const findMatch = (predicate: (option: T) => boolean) => options.find(predicate) ?? null;

  const cardOption = findMatch((option) => {
    const type = String(option.payment_type || "").toLowerCase();
    const name = String(option.name || "").toLowerCase();
    return type.includes("card") || (!type && name.includes("card"));
  });
  if (cardOption) {
    return cardOption;
  }

  const bankTransferOption = findMatch((option) => {
    const type = String(option.payment_type || "").toLowerCase();
    const name = String(option.name || "").toLowerCase();
    return (
      type.includes("bank") ||
      type.includes("transfer") ||
      (!type && (name.includes("bank") || name.includes("transfer")))
    );
  });
  if (bankTransferOption) {
    return bankTransferOption;
  }

  return options[0] ?? null;
};

/**
 * Formats a number as currency with 2 decimal places
 */
export const formatCurrencyValue = (amount: unknown) => {
  const numeric = toNumberValue(amount);
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
export const findLabel = (collection: EntityLike[], id: string, fallbackPrefix?: string) => {
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
      .map((value) => toStringValue(value))
      .filter(Boolean);
    return candidates.includes(String(id));
  });
  if (!match) return fallbackPrefix ? `${fallbackPrefix} selected` : "Selected";
  const resolved =
    toStringValue(match.name) ||
    toStringValue(match.label) ||
    toStringValue(match.productable?.name);
  return resolved || (fallbackPrefix ? `${fallbackPrefix} selected` : "Selected");
};

/**
 * Formats compute instance label with specs
 */
export const formatComputeLabel = (id: string, instanceTypes: EntityLike[]) => {
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
      .map((value) => toStringValue(value))
      .filter(Boolean);
    return candidates.includes(String(id));
  });
  if (!match) return id ? "Instance selected" : "Not selected";
  const memoryMb = toNumberValue(match.memory_mb);
  const memoryGb = memoryMb ? Math.round(memoryMb / 1024) : toNumberValue(match.memory_gb);
  const meta = [];
  const vcpus = toNumberValue(match.vcpus);
  if (vcpus) meta.push(`${vcpus} vCPU`);
  if (memoryGb) meta.push(`${memoryGb} GB RAM`);
  const baseName = toStringValue(match.name || match.productable?.name || "Instance selected");
  return meta.length ? `${baseName} • ${meta.join(" • ")}` : baseName;
};

/**
 * Formats OS image label
 */
export const formatOsLabel = (id: string, osImages: EntityLike[]) => findLabel(osImages, id, "OS");

/**
 * Formats volume label with size
 */
export const formatVolumeLabel = (id: string, size: number | string, volumeTypes: EntityLike[]) => {
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
      .map((value) => toStringValue(value))
      .filter(Boolean);
    return candidates.includes(String(id));
  });
  const label = toStringValue(match?.name || match?.productable?.name) || "Volume selected";
  return size ? `${label} • ${size} GB` : label;
};

/**
 * Formats keypair label
 */
export const formatKeypairLabel = (value: string, keyPairs: EntityLike[], explicitLabel = "") => {
  if (explicitLabel) return explicitLabel;
  if (!value) return "No key pair";
  const match = keyPairs.find((kp) => {
    const candidate = kp.name || kp.id;
    return candidate !== undefined && String(candidate) === String(value);
  });
  const resolved = toStringValue(match?.name || match?.label);
  return resolved || value || "No key pair";
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
export const toNumber = (value: unknown) => toNumberValue(value);

const normalizeTemplateIdList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (isRecord(item)) {
          return item["value"] ?? item["id"] ?? item["identifier"] ?? item;
        }
        return item;
      })
      .map((item) => toStringValue(item).trim())
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

const pickDefined = (...values: unknown[]) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const buildTemplateVolume = (volume: unknown, index: number): AdditionalVolume => {
  const record = asRecord(volume);
  const storageSize = pickDefined(record["storage_size_gb"], record["size_gb"], record["size"]);
  const resolvedStorageSize =
    typeof storageSize === "number" || typeof storageSize === "string" ? storageSize : 0;
  return {
    id: toStringValue(record["id"]) || `tmpl_${index}_${Math.random().toString(36).slice(2, 8)}`,
    volume_type_id:
      toStringValue(pickDefined(record["volume_type_id"], record["id"], record["identifier"])) ||
      "",
    storage_size_gb: resolvedStorageSize,
  };
};

// --- buildConfigurationFromTemplate Helper Extractors ---

const extractTemplateBasicInfo = (
  templateRecord: UnknownRecord,
  config: UnknownRecord,
  patch: Partial<Configuration>
) => {
  const templateId = templateRecord["id"] || templateRecord["identifier"];
  if (templateId) patch.template_id = String(templateId);
  if (templateRecord["name"]) patch.template_name = String(templateRecord["name"]);
  patch.template_locked = true;
  patch.project_mode = "new";
  patch.project_id = "";

  const uniqueSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const baseProjectName = pickDefined(config["project_name"], templateRecord["name"], "Template");
  const normalizedBase = String(baseProjectName || "Template").trim() || "Template";
  patch.project_name = normalizedBase.toLowerCase().includes("project")
    ? `${normalizedBase} ${uniqueSuffix}`
    : `${normalizedBase} Project ${uniqueSuffix}`;

  const region = pickDefined(config["region"], config["region_code"], config["location"]);
  if (region) patch.region = String(region);
};

const extractComputeInfo = (config: UnknownRecord, patch: Partial<Configuration>) => {
  const instanceCount = pickDefined(
    config["instance_count"],
    config["number_of_instances"],
    config["quantity"]
  );
  if (instanceCount !== undefined) {
    patch.instance_count = toNumberOrString(instanceCount);
  }

  const months = pickDefined(config["months"], config["term_months"], config["billing_months"]);
  if (months !== undefined) {
    patch.months = toNumberOrString(months);
  }

  const compute = asRecord(config["compute"]);
  const computeId = pickDefined(
    config["compute_instance_id"],
    compute["instance_type_id"],
    compute["id"],
    compute["instance_id"]
  );
  if (computeId) patch.compute_instance_id = String(computeId);
};

const extractOsAndStorageInfo = (
  config: UnknownRecord,
  primaryVolume: UnknownRecord,
  patch: Partial<Configuration>
) => {
  const osImage = asRecord(config["os_image"]);
  const osImageId = pickDefined(
    config["os_image_id"],
    osImage["os_image_id"],
    osImage["id"],
    osImage["identifier"]
  );
  if (osImageId) patch.os_image_id = String(osImageId);

  const volumeTypeId = pickDefined(
    config["volume_type_id"],
    primaryVolume["volume_type_id"],
    primaryVolume["id"],
    primaryVolume["identifier"]
  );
  if (volumeTypeId) patch.volume_type_id = String(volumeTypeId);

  const storageSize = pickDefined(
    config["storage_size_gb"],
    primaryVolume["storage_size_gb"],
    primaryVolume["size_gb"],
    primaryVolume["size"]
  );
  if (storageSize !== undefined) {
    patch.storage_size_gb = toNumberOrString(storageSize);
  }
};

const extractNetworkingInfo = (config: UnknownRecord, patch: Partial<Configuration>) => {
  const networking = asRecord(config["networking"]);
  const bandwidth = asRecord(networking["bandwidth"]);

  const bandwidthId = pickDefined(
    config["bandwidth_id"],
    networking["bandwidth_id"],
    bandwidth["id"]
  );
  if (bandwidthId) patch.bandwidth_id = String(bandwidthId);

  const bandwidthCount = pickDefined(config["bandwidth_count"], networking["bandwidth_count"]);
  if (bandwidthCount !== undefined) {
    patch.bandwidth_count = toNumberOrString(bandwidthCount);
  }

  const floatingIpCount = pickDefined(config["floating_ip_count"], networking["floating_ip_count"]);
  if (floatingIpCount !== undefined) {
    patch.floating_ip_count = toNumberOrString(floatingIpCount);
  }

  const securityGroups = pickDefined(
    config["security_group_ids"],
    config["security_groups"],
    networking["security_group_ids"],
    networking["security_groups"]
  );
  const normalizedSecurityGroups = normalizeTemplateIdList(securityGroups);
  if (normalizedSecurityGroups.length > 0) patch.security_group_ids = normalizedSecurityGroups;

  const networkId = pickDefined(config["network_id"], networking["network_id"], config["vpc_id"]);
  if (networkId) patch.network_id = String(networkId);

  const subnet = asRecord(config["subnet"]);
  const subnetId = pickDefined(config["subnet_id"], networking["subnet_id"], subnet["id"]);
  if (subnetId) patch.subnet_id = String(subnetId);

  const networkPreset = pickDefined(
    config["network_preset"],
    asRecord(config["metadata"])["network_preset"],
    networking["preset"]
  );
  const normalizedPreset = networkPreset ? String(networkPreset) : "standard";
  patch.network_preset = normalizedPreset === "empty" ? "standard" : normalizedPreset;
};

const extractAdditionalInfo = (config: UnknownRecord, patch: Partial<Configuration>) => {
  const keypair = asRecord(config["keypair"]);
  const auth = asRecord(config["auth"]);
  const keypairName = pickDefined(config["keypair_name"], keypair["name"], auth["keypair_name"]);
  if (keypairName) patch.keypair_name = String(keypairName);

  const tags = pickDefined(
    config["tags"],
    config["tag_list"],
    asRecord(config["networking"])["tags"]
  );
  if (Array.isArray(tags)) {
    patch.tags = tags.map((tag) => toStringValue(tag)).join(",");
  } else if (tags) {
    patch.tags = String(tags);
  }
};

export const buildConfigurationFromTemplate = (template: unknown): Partial<Configuration> => {
  const templateRecord = asRecord(template);
  const config = asRecord(templateRecord["configuration"]);
  const patch: Partial<Configuration> = {};

  extractTemplateBasicInfo(templateRecord, config, patch);
  extractComputeInfo(config, patch);

  const rawVolumeEntries = Array.isArray(config["volume_types"])
    ? config["volume_types"]
    : Array.isArray(config["volumes"])
      ? config["volumes"]
      : [];
  const primaryVolume = isRecord(rawVolumeEntries[0]) ? rawVolumeEntries[0] : {};

  extractOsAndStorageInfo(config, primaryVolume, patch);
  extractNetworkingInfo(config, patch);
  extractAdditionalInfo(config, patch);

  if (patch.project_mode === "new") {
    patch.network_id = "";
    patch.subnet_id = "";
    patch.security_group_ids = [];
  }

  const additionalVolumes = asRecord(config)["additional_volumes"];
  const existingAdditionalVolumes = Array.isArray(additionalVolumes)
    ? additionalVolumes.map((volume, index) => buildTemplateVolume(volume, index))
    : [];

  if (existingAdditionalVolumes.length > 0) {
    patch.additional_volumes = existingAdditionalVolumes;
  } else if (rawVolumeEntries.length > 1) {
    patch.additional_volumes = rawVolumeEntries
      .slice(1)
      .map((volume, index) => buildTemplateVolume(volume, index + 1));
  }

  return patch;
};

export const hasProjectNetworkFromStatus = (status: unknown, project?: unknown): boolean => {
  const statusRecord = asRecord(status);
  const projectRecord = asRecord(project);

  const data = asRecord(statusRecord["data"]);
  const projectStatus = asRecord(statusRecord["project"] || data["project"] || statusRecord);

  if (projectStatus["vpc_enabled"] || projectRecord["vpc_enabled"]) return true;

  const summary = Array.isArray(projectStatus["summary"]) ? projectStatus["summary"] : [];
  const summaryHasVpc = summary.some((item: unknown) => {
    const record = asRecord(item);
    const title = toStringValue(record["title"]).toLowerCase();
    return record["completed"] === true && title.includes("vpc");
  });
  if (summaryHasVpc) return true;

  const progress = asRecord(projectStatus["provisioning_progress"]);
  if (progress["vpc_enabled"]) return true;

  const progressSteps = Array.isArray(progress["steps"])
    ? progress["steps"]
    : Array.isArray(progress)
      ? progress
      : [];
  return progressSteps.some((step: unknown) => {
    const record = asRecord(step);
    const key = toStringValue(record["key"] || record["id"] || record["label"]).toLowerCase();
    const statusValue = toStringValue(record["status"]).toLowerCase();
    return key.includes("vpc") && (record["completed"] === true || statusValue === "completed");
  });
};
