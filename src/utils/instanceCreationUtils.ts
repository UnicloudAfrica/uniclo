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
  const match = collection.find(
    (item) => String(item.id || item.identifier || item.name) === String(id)
  );
  if (!match) return fallbackPrefix ? `${fallbackPrefix} ${id}` : String(id);
  return match.name || match.label || `${fallbackPrefix || "Item"} ${id}`;
};

/**
 * Formats compute instance label with specs
 */
export const formatComputeLabel = (id: string, instanceTypes: any[]) => {
  const match = instanceTypes.find((item) => String(item.id) === String(id));
  if (!match) return id ? `Instance ${id}` : "Not selected";
  const memoryGb = match.memory_mb ? Math.round(Number(match.memory_mb) / 1024) : match.memory_gb;
  const meta = [];
  if (match.vcpus) meta.push(`${match.vcpus} vCPU`);
  if (memoryGb) meta.push(`${memoryGb} GB RAM`);
  return meta.length ? `${match.name} • ${meta.join(" • ")}` : match.name;
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
  const match = volumeTypes.find((item) => String(item.id) === String(id));
  const label = match?.name || `Volume ${id}`;
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
