// Object Storage Utility Functions
// Extracted from adminObjectStorageCreate.js for reusability

export interface Option {
  value: string;
  label: string;
  raw?: any;
  currency?: string;
  tenantId?: string;
}

export interface ServiceProfile {
  id: string;
  name: string;
  region: string;
  tierKey: string;
  storageGb: string;
  months: string;
  unitPriceOverride: string;
}

export interface PricingData {
  productable_id?: string;
  productable_type?: string;
  product_id?: string;
  id?: string;
  product?: any;
  pricing?: any;
  region?: string;
  product_name?: string;
  provider_resource_id?: string;
  price_local?: number;
  price_usd?: number;
  price?: number;
  total_price?: number;
  currency?: string;
  price_currency?: string;
  currency_code?: string;
  quota_gb?: number;
  quota?: number;
  object_storage_configuration?: any;
  object_storage?: any;
}

export const COUNTRY_FALLBACK: Option[] = [
  { value: "US", label: "United States (US)", currency: "USD" },
  { value: "NG", label: "Nigeria (NG)", currency: "NGN" },
  { value: "GB", label: "United Kingdom (GB)", currency: "GBP" },
  { value: "ZA", label: "South Africa (ZA)", currency: "ZAR" },
  { value: "KE", label: "Kenya (KE)", currency: "KES" },
];

export const OBJECT_STORAGE_KEYWORDS = ["object_storage", "object storage"];
export const GLOBAL_TIER_KEY = "__all__";

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
export const getPricingRegionCode = (pricing: any): string =>
  pricing?.region ||
  pricing?.product?.region ||
  pricing?.product?.region_code ||
  pricing?.product?.provider_region ||
  pricing?.product?.location ||
  "";

/**
 * Create a unique tier key from region and pricing data
 */
export const makeTierKey = (regionKey: string, pricing: any): string => {
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
export const toLowerCaseStrings = (values: any[] = []): string[] =>
  values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        (typeof value === "string" || typeof value === "number")
    )
    .map((value) => value.toString().toLowerCase().trim())
    .filter(Boolean);

/**
 * Check if values include object storage keywords
 */
export const includesObjectStorageKeyword = (candidates: string[] = []): boolean =>
  candidates.some((value) => OBJECT_STORAGE_KEYWORDS.some((keyword) => value.includes(keyword)));

/**
 * Determine if pricing is for object storage
 */
export const isObjectStoragePricing = (pricing: any): boolean => {
  if (!pricing || typeof pricing !== "object") {
    return false;
  }

  const typeCandidates = toLowerCaseStrings([
    pricing.productable_type,
    pricing.product_type,
    pricing.productableType,
    pricing.productable_type,
    pricing.product?.productable_type,
    pricing.product?.product_type,
    pricing.product?.productable?.type,
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
export const resolveTierUnitPrice = (tier: any): number => {
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
export const resolveTierQuota = (tier: any): number => {
  if (!tier) return 0;
  const candidates = [
    tier.product?.object_storage?.quota_gb,
    tier.product?.productable?.quota_gb,
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
export const resolveTierUnitPricePerGb = (tier: any): number => {
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
export const resolveTierCurrency = (tier: any, fallback: string = "USD"): string => {
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
export const getRegionCode = (region: any): string => {
  if (!region) return "";
  return (
    region.code ||
    region.region_code ||
    region.region ||
    region.identifier ||
    region.slug ||
    region.id ||
    ""
  ).toString();
};

/**
 * Build tier label for display
 */
export const buildTierLabel = (
  pricing: any,
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
export const getTierDisplayName = (pricing: any): string =>
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
  } catch (error) {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
};

/**
 * Normalize payment options from various formats
 */
export const normalizePaymentOptions = (options: any): any => {
  if (!options) return null;
  if (typeof options === "string") {
    try {
      return JSON.parse(options);
    } catch (error) {
      return null;
    }
  }
  if (typeof options === "object") {
    return options;
  }
  return null;
};

/**
 * Normalize country code candidate
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
 * Match country from options
 */
export const matchCountryFromOptions = (
  value: any,
  countryOptions: Option[] = COUNTRY_FALLBACK
): string => {
  if (value === null || value === undefined) return "";
  const normalized = normalizeCountryCandidate(value);
  if (normalized) return normalized;

  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();

  const match = countryOptions.find((option) => {
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
 * Resolve country code from entity
 */
export const resolveCountryCodeFromEntity = (
  entity: any,
  countryOptions: Option[] = COUNTRY_FALLBACK
): string => {
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
    const code = matchCountryFromOptions(candidate, countryOptions);
    if (code) {
      return code;
    }
  }

  return "";
};

/**
 * Format country options from API data
 */
export const formatCountryOptions = (sharedCountries: any[]): Option[] => {
  const apiCountries = Array.isArray(sharedCountries) ? sharedCountries : [];
  if (apiCountries.length > 0) {
    const mapped = apiCountries
      .map((item: any): Option | null => {
        const code =
          normalizeCountryCandidate(
            item?.code ||
              item?.iso2 ||
              item?.country_code ||
              item?.iso_code ||
              item?.iso ||
              item?.id ||
              item?.country ||
              ""
          ) || "";
        if (!code) return null;
        const upper = code.toUpperCase();
        const name = item?.name || item?.country_name || item?.country || upper;
        return {
          value: upper,
          label: name && name.toLowerCase() !== upper.toLowerCase() ? `${name} (${upper})` : upper,
          currency: item?.currency_code || item?.currency || item?.currencyCode || "USD",
        };
      })
      .filter((item): item is Option => Boolean(item));

    const hasUS = mapped.some(
      (option) => option?.value && String(option.value).toUpperCase() === "US"
    );
    return hasUS
      ? mapped
      : [{ value: "US", label: "United States (US)", currency: "USD" }, ...mapped];
  }

  return [...COUNTRY_FALLBACK];
};

/**
 * Format region options from API data
 */
export const formatRegionOptions = (regions: any[]): Option[] => {
  const seen = new Set<string>();
  return (Array.isArray(regions) ? regions : [])
    .map((region): Option | null => {
      const code = getRegionCode(region);
      if (!code) return null;
      const lower = code.toLowerCase();
      if (seen.has(lower)) return null;
      seen.add(lower);
      const name =
        region.name || region.display_name || region.region_name || region.provider_label || code;
      const label =
        name && name.toLowerCase() !== code.toLowerCase() ? `${name} (${code})` : name || code;
      return { value: code, label };
    })
    .filter((item): item is Option => Boolean(item));
};
