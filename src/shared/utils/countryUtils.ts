export interface Option {
  value: string | number;
  label: string;
  currency?: string;
  raw?: unknown;
  [key: string]: unknown;
}

export const COUNTRY_FALLBACK: Option[] = [
  { value: "US", label: "United States (US)", currency: "USD" },
  { value: "NG", label: "Nigeria (NG)", currency: "NGN" },
];

/**
 * Normalize country code candidate
 */
const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

export const normalizeCountryCandidate = (value: unknown): string => {
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
  value: unknown,
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
  entity: unknown,
  countryOptions: Option[] = COUNTRY_FALLBACK
): string => {
  if (!entity) return "";
  const record = asRecord(entity);
  const billing = asRecord(record["billing"]);
  const location = asRecord(record["location"]);
  const address = asRecord(record["address"]);
  const profile = asRecord(record["profile"]);
  const metadata = asRecord(record["metadata"]);
  const primaryContact = asRecord(record["primary_contact"]);
  const contact = asRecord(record["contact"]);
  const tenant = asRecord(record["tenant"]);
  const settings = asRecord(record["settings"]);
  const business = asRecord(record["business"]);
  const businessProfile = asRecord(record["business_profile"]);
  const businessSettings = asRecord(record["business_settings"]);
  const candidates = [
    // Standard fields
    record["country_code"],
    record["countryCode"],
    record["country_iso"],
    record["countryIso"],
    record["country"],
    // Billing specific
    record["billing_country_code"],
    record["billingCountryCode"],
    record["billing_country"],
    record["billingCountry"],
    billing["country_code"],
    billing["countryCode"],
    billing["country"],
    // Location/Address
    location["country_code"],
    location["countryCode"],
    address["country_code"],
    address["countryCode"],
    // Profile/Metadata
    profile["country_code"],
    profile["countryCode"],
    metadata["country_code"],
    metadata["countryCode"],
    // Contacts
    primaryContact["country_code"],
    primaryContact["countryCode"],
    contact["country_code"],
    contact["countryCode"],
    // Tenant specific
    record["tenant_country_code"],
    record["tenant_country"],
    tenant["country_code"],
    tenant["country"],
    // Settings
    settings["country_code"],
    settings["country"],
    // Business (common in tenant settings)
    business["country_code"],
    business["country"],
    // Business Profile (Client)
    businessProfile["country_code"],
    businessProfile["country"],
    businessSettings["country_code"],
    businessSettings["country"],
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
export const formatCountryOptions = (sharedCountries: unknown[]): Option[] => {
  const apiCountries = Array.isArray(sharedCountries) ? sharedCountries : [];
  if (apiCountries.length > 0) {
    const mapped = apiCountries
      .map((item: unknown): Option | null => {
        const record = asRecord(item);
        const code =
          normalizeCountryCandidate(
            record["code"] ||
              record["iso2"] ||
              record["country_code"] ||
              record["iso_code"] ||
              record["iso"] ||
              record["id"] ||
              record["country"] ||
              ""
          ) || "";
        if (!code) return null;
        const upper = code.toUpperCase();
        const rawName = record["name"] || record["country_name"] || record["country"] || upper;
        const name = String(rawName);
        const currency =
          record["currency_code"] || record["currency"] || record["currencyCode"] || "USD";

        return {
          value: upper,
          label: name && name.toLowerCase() !== upper.toLowerCase() ? `${name} (${upper})` : upper,
          currency: String(currency),
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
