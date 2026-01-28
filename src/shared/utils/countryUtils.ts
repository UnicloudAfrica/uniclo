export interface Option {
    value: string | number;
    label: string;
    currency?: string;
    raw?: any;
    [key: string]: any;
}

export const COUNTRY_FALLBACK: Option[] = [
    { value: "US", label: "United States (US)", currency: "USD" },
    { value: "NG", label: "Nigeria (NG)", currency: "NGN" },
];

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
        // Standard fields
        entity.country_code,
        entity.countryCode,
        entity.country_iso,
        entity.countryIso,
        entity.country,
        // Billing specific
        entity.billing_country_code,
        entity.billingCountryCode,
        entity.billing_country,
        entity.billingCountry,
        entity.billing?.country_code,
        entity.billing?.countryCode,
        entity.billing?.country,
        // Location/Address
        entity.location?.country_code,
        entity.location?.countryCode,
        entity.address?.country_code,
        entity.address?.countryCode,
        // Profile/Metadata
        entity.profile?.country_code,
        entity.profile?.countryCode,
        entity.metadata?.country_code,
        entity.metadata?.countryCode,
        // Contacts
        entity.primary_contact?.country_code,
        entity.primary_contact?.countryCode,
        entity.contact?.country_code,
        entity.contact?.countryCode,
        // Tenant specific
        entity.tenant_country_code,
        entity.tenant_country,
        entity.tenant?.country_code,
        entity.tenant?.country,
        // Settings
        entity.settings?.country_code,
        entity.settings?.country,
        // Business (common in tenant settings)
        entity.business?.country_code,
        entity.business?.country,
        // Business Profile (Client)
        entity.business_profile?.country_code,
        entity.business_profile?.country,
        entity.business_settings?.country_code,
        entity.business_settings?.country,
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
