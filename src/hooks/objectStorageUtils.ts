// Object Storage Utility Functions
// Extracted from adminObjectStorageCreate.js for reusability

// Local interfaces
export interface ServiceProfile {
  id: string;
  name: string;
  region: string;
  tierKey: string;
  storageGb: string;
  months: string;
  unitPriceOverride: string;
}

export const OBJECT_STORAGE_KEYWORDS = ["object_storage", "object storage"];
export const GLOBAL_TIER_KEY = "__all__";

type UnknownRecord = Record<string, unknown>;

type PricingLike = UnknownRecord & {
  id?: string | number;
  product?: UnknownRecord & {
    id?: string | number;
    name?: string;
    product_name?: string;
    region?: string;
    region_code?: string;
    provider_region?: string;
    location?: string;
    productable_type?: string;
    product_type?: string;
    service_type?: string;
    service_category?: string;
    quota_gb?: number | string;
    quota?: number | string;
    object_storage?: { quota_gb?: number | string };
  };
  pricing?: UnknownRecord & {
    price_local?: number | string;
    price_usd?: number | string;
    price?: number | string;
    total_price?: number | string;
    currency?: string;
    currency_code?: string;
    currencyCode?: string;
  };
  object_storage?: { quota_gb?: number | string };
  object_storage_configuration?: UnknownRecord;
  productable_id?: string | number;
  product_id?: string | number;
  productable_type?: string;
  product_type?: string;
  product_name?: string;
  provider_resource_id?: string;
  region?: string;
  price_local?: number | string;
  price_usd?: number | string;
  price?: number | string;
  total_price?: number | string;
  currency?: string;
  price_currency?: string;
  currency_code?: string;
  currencyCode?: string;
  quota_gb?: number | string;
  quota?: number | string;
};

type RegionLike = UnknownRecord & {
  code?: string;
  region_code?: string;
  region?: string;
  identifier?: string;
  slug?: string;
  id?: string | number;
  name?: string;
  display_name?: string;
  region_name?: string;
  provider_label?: string;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

/**
 * Generate a unique profile ID
 */
export const generateProfileId = (): string => `profile_${Math.random().toString(36).slice(2, 10)}`;

/**
 * Create a new service profile with defaults
 */
export const createServiceProfile = (): ServiceProfile => ({
  id: generateProfileId(),
  name: "",
  region: "",
  tierKey: "",
  storageGb: "",
  months: "12",
  unitPriceOverride: "",
});

/**
 * Get region code from pricing object
 */
export const getPricingRegionCode = (pricing?: PricingLike | null): string =>
  pricing?.region ||
  pricing?.product?.region ||
  pricing?.product?.region_code ||
  pricing?.product?.provider_region ||
  pricing?.product?.location ||
  "";

/**
 * Create a unique tier key from region and pricing data
 */
export const makeTierKey = (regionKey: string, pricing?: PricingLike | null): string => {
  const baseId =
    pricing?.productable_id ??
    pricing?.product_id ??
    pricing?.id ??
    pricing?.product?.productable_id ??
    pricing?.product?.id ??
    pricing?.provider_resource_id ??
    pricing?.product_name ??
    "";
  const normalizedRegion = regionKey?.toLowerCase().trim() || "region";
  const normalizedId =
    String(baseId || "").trim() || pricing?.id || Math.random().toString(36).slice(2, 10);
  return `${normalizedRegion}::${normalizedId}`;
};

/**
 * Convert values to lowercase strings for comparison
 */
export const toLowerCaseStrings = (
  values: (string | number | undefined | null | unknown)[] = []
): string[] => {
  const result: string[] = [];
  values.forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== null && v !== undefined && (typeof v === "string" || typeof v === "number")) {
          result.push(v.toString().toLowerCase().trim());
        }
      });
    } else if (
      value !== null &&
      value !== undefined &&
      (typeof value === "string" || typeof value === "number")
    ) {
      result.push(value.toString().toLowerCase().trim());
    }
  });
  return result.filter(Boolean);
};

/**
 * Check if values include object storage keywords
 */
export const includesObjectStorageKeyword = (candidates: string[] = []): boolean =>
  candidates.some((value) => OBJECT_STORAGE_KEYWORDS.some((keyword) => value.includes(keyword)));

/**
 * Determine if pricing is for object storage
 */
export const isObjectStoragePricing = (pricing?: PricingLike | null): boolean => {
  if (!pricing || typeof pricing !== "object") {
    return false;
  }

  const typeCandidates = toLowerCaseStrings([
    pricing.productable_type,
    pricing.product_type,
    pricing.productableType,
    pricing.product?.productable_type,
    pricing.product?.product_type,
    pricing.product?.service_type,
    pricing.product?.service_category,
  ]);

  if (includesObjectStorageKeyword(typeCandidates)) {
    return true;
  }

  if (pricing.product?.object_storage || pricing.object_storage_configuration) {
    return true;
  }

  const nameCandidates = toLowerCaseStrings([
    pricing.product?.name,
    pricing.product_name,
    pricing.product?.product_name,
    pricing.provider_resource_id,
  ]);

  if (nameCandidates.some((value) => value.includes("object storage"))) {
    return true;
  }

  return false;
};

/**
 * Resolve unit price from tier data
 */
export const resolveTierUnitPrice = (tier?: PricingLike | null): number => {
  if (!tier) return 0;
  const candidates = [
    tier.price_local,
    tier.price_usd,
    tier.price,
    tier.total_price,
    tier.pricing?.price_local,
    tier.pricing?.price_usd,
    tier.pricing?.price,
    tier.pricing?.total_price,
  ];
  for (const value of candidates) {
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return numeric;
    }
  }
  return 0;
};

/**
 * Resolve quota (GiB) from tier data
 */
export const resolveTierQuota = (tier?: PricingLike | null): number => {
  if (!tier) return 0;
  const candidates = [
    tier.product?.object_storage?.quota_gb,
    tier.product?.quota_gb,
    tier.product?.quota,
    tier.object_storage?.quota_gb,
    tier.quota_gb,
    tier.quota,
  ];
  for (const value of candidates) {
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return Math.floor(numeric);
    }
  }
  return 0;
};

/**
 * Resolve per-GB unit price from tier data
 */
export const resolveTierUnitPricePerGb = (tier?: PricingLike | null): number => {
  const total = resolveTierUnitPrice(tier);
  if (!total) return 0;
  const quota = resolveTierQuota(tier);
  if (quota > 0) {
    return total / quota;
  }
  return total;
};

/**
 * Resolve currency from tier data
 */
export const resolveTierCurrency = (
  tier?: PricingLike | null,
  fallback: string = "USD"
): string => {
  if (!tier) return fallback;
  const candidates = [
    tier.currency,
    tier.price_currency,
    tier.currency_code,
    tier.currencyCode,
    tier.pricing?.currency,
    tier.pricing?.currency_code,
    tier.pricing?.currencyCode,
  ];
  for (const value of candidates) {
    if (value) return value.toString().toUpperCase();
  }
  return fallback;
};

/**
 * Get region code from region object
 */
export const getRegionCode = (region?: RegionLike | null): string => {
  if (!region) return "";
  return String(
    region.code ||
      region.region_code ||
      region.region ||
      region.identifier ||
      region.slug ||
      region.id ||
      ""
  );
};

/**
 * Build tier label for display
 */
export const buildTierLabel = (
  pricing?: PricingLike | null,
  currencyOverride?: string | null,
  selectedCurrency?: string
): string => {
  if (!pricing) return "Object storage tier";
  const name =
    pricing.product?.name ||
    pricing.product_name ||
    pricing.product?.product_name ||
    pricing.provider_resource_id ||
    `Tier ${pricing.productable_id ?? pricing.id ?? ""}`.trim();
  const quota = resolveTierQuota(pricing) || null;
  const perGbPrice = resolveTierUnitPricePerGb(pricing);
  const tierCurrency = resolveTierCurrency(pricing);
  const currency = currencyOverride || tierCurrency;
  const parts = [name];
  if (quota) {
    parts.push(`${quota} GiB`);
  }
  if (perGbPrice) {
    const mainLabel = `${currency} ${perGbPrice.toFixed(2)} / GB / mo`;
    if (selectedCurrency && currency && selectedCurrency !== currency) {
      parts.push(`${selectedCurrency} (${mainLabel})`);
    } else {
      parts.push(mainLabel);
    }
  }
  return parts.join(" • ");
};

/**
 * Get display name for a tier
 */
export const getTierDisplayName = (pricing?: PricingLike | null): string =>
  pricing?.product?.name ||
  pricing?.product_name ||
  pricing?.product?.product_name ||
  pricing?.provider_resource_id ||
  "";

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number | string, currency?: string): string => {
  const numericAmount = Number(amount) || 0;
  if (!currency) {
    return numericAmount.toFixed(2);
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
};

/**
 * Normalize payment options from various formats
 */
export const normalizePaymentOptions = (options: unknown): unknown => {
  if (!options) return null;
  if (typeof options === "string") {
    try {
      return JSON.parse(options);
    } catch {
      return null;
    }
  }
  if (typeof options === "object") {
    return options;
  }
  return null;
};

import { type Option } from "../shared/utils/countryUtils";

// Re-export country utils
export {
  COUNTRY_FALLBACK,
  normalizeCountryCandidate,
  matchCountryFromOptions,
  resolveCountryCodeFromEntity,
  formatCountryOptions,
  type Option,
} from "../shared/utils/countryUtils";

/**
 * Format region options from API data
 */
export const formatRegionOptions = (regions: unknown[] = []): Option[] => {
  const seen = new Set<string>();
  return (Array.isArray(regions) ? regions : [])
    .map((region): Option | null => {
      if (!isRecord(region)) return null;
      const code = getRegionCode(region);
      if (!code) return null;
      const lower = code.toLowerCase();
      if (seen.has(lower)) return null;
      seen.add(lower);
      const name =
        region.name || region.display_name || region.region_name || region.provider_label || code;
      const label =
        name && String(name).toLowerCase() !== code.toLowerCase()
          ? `${name} (${code})`
          : name || code;
      return { value: code, label: String(label) };
    })
    .filter((item): item is Option => Boolean(item));
};
