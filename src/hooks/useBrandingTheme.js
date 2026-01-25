import { useEffect, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import silentApi from "../index/silent";
import clientSilentApi from "../index/client/silent";
import adminSilentSettingsApi from "../index/admin/silentSettingsApi";
import useClientAuthStore from "../stores/clientAuthStore";
import useTenantAuthStore from "../stores/tenantAuthStore";

// Default colors pulled from the platform marketing palette.
const DEFAULT_ACCENT = "#288DD1"; // UniCloud blue (global default)
const DEFAULT_PRIMARY = "#3FE0C8"; // UniCloud teal (secondary default)
const LEGACY_PLATFORM_ACCENT = "#1c1c1c";
const LEGACY_PLATFORM_PRIMARY = "#14547f";

const DEFAULT_LOGO_PATH = "assets/images/logo.png";
const LOGO_URL_PREFIXES = ["data:", "blob:", "http://", "https://", "//"];

const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";
const normalizeHex = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeLogoValue = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value.trim();
  if (typeof value === "object" && typeof value.url === "string") {
    return value.url.trim();
  }
  return null;
};

const isBlankLogoValue = (value) => {
  if (!value) return true;
  const normalized = String(value).trim().toLowerCase();
  return !normalized || normalized === "null" || normalized === "undefined";
};

const isDefaultLogoValue = (value) => {
  if (isBlankLogoValue(value)) return true;
  const normalized = String(value).trim().toLowerCase();
  return normalized.includes(DEFAULT_LOGO_PATH);
};

const isAbsoluteLogoUrl = (value) =>
  LOGO_URL_PREFIXES.some((prefix) => value.toLowerCase().startsWith(prefix));

const joinUrl = (base, path) => {
  const normalizedBase = String(base).replace(/\/+$/, "");
  const normalizedPath = String(path).replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
};

const resolveTenantId = (tenant) =>
  tenant?.id || tenant?.identifier || tenant?.tenant_id || tenant?.uuid || null;

export const getTenantId = resolveTenantId;

const isLegacyPlatformPalette = (accentColor, primaryColor) => {
  return (
    normalizeHex(accentColor) === LEGACY_PLATFORM_ACCENT &&
    normalizeHex(primaryColor) === LEGACY_PLATFORM_PRIMARY
  );
};

const mapBrandingPayload = (payload = {}) => {
  const brand = payload.brand ?? {};
  const company = payload.company ?? {};
  const palette = brand.palette ?? {};
  const logoCandidate =
    normalizeLogoValue(payload.logo) ??
    normalizeLogoValue(brand.logo) ??
    normalizeLogoValue(company.logo) ??
    normalizeLogoValue(company.logo_url) ??
    normalizeLogoValue(brand.logo_url) ??
    null;
  const logo = isBlankLogoValue(logoCandidate) ? null : logoCandidate;
  const faviconCandidate =
    normalizeLogoValue(payload.favicon) ??
    normalizeLogoValue(brand.favicon) ??
    normalizeLogoValue(company.favicon) ??
    null;
  const favicon = isBlankLogoValue(faviconCandidate) ? null : faviconCandidate;
  const hasPaletteValues = Object.values(palette).some(isNonEmptyString);
  const hasColorOverrides = [
    palette.accent,
    palette.primary,
    brand.accent_color,
    brand.primary_color,
    company.accent_color,
    company.primary_color,
  ].some(isNonEmptyString);

  const accentColor =
    palette.accent ?? brand.accent_color ?? company.accent_color ?? DEFAULT_ACCENT;
  const primaryColor =
    palette.primary ?? brand.primary_color ?? company.primary_color ?? DEFAULT_PRIMARY;
  const isLegacyPlatformTheme =
    isLegacyPlatformPalette(accentColor, primaryColor) &&
    !hasPaletteValues &&
    !favicon &&
    isDefaultLogoValue(logoCandidate);
  const hasExplicitColors = hasColorOverrides && !isLegacyPlatformTheme;
  const hasCustomBranding =
    !isDefaultLogoValue(logoCandidate) || Boolean(favicon) || hasPaletteValues || hasExplicitColors;

  return {
    logo,
    favicon,
    logoHref:
      payload.logo_href ?? company.logo_href ?? company.website ?? company.support_url ?? null,
    company,
    brand,
    palette,
    accentColor,
    primaryColor,
    hasCustomBranding,
    isLegacyPlatformTheme,
    isFallback: !hasCustomBranding,
    raw: payload,
  };
};

const DEFAULT_BRANDING_THEME = mapBrandingPayload();

const shouldFallbackTheme = (theme) => !theme || theme.isFallback;

export const resolveEffectiveBrandingTheme = (theme, fallbackTheme) => {
  if (!shouldFallbackTheme(theme)) {
    return theme;
  }
  return fallbackTheme ?? theme ?? null;
};

const isMissingBrandingRoute = (error) => {
  if (!error) return false;
  const message = String(error.message || error).toLowerCase();
  return message.includes("could not be found") || message.includes("not found");
};

const PUBLIC_BRANDING_CACHE_PREFIX = "public-branding:v2:";
const AUTH_BRANDING_CACHE_PREFIX = "auth-branding:v1:";

const buildPublicBrandingCacheKey = ({ tenantId, domain, subdomain } = {}) => {
  const safeTenantId = tenantId ? String(tenantId).trim() : "";
  const safeDomain = domain ? String(domain).trim().toLowerCase() : "";
  const safeSubdomain = subdomain ? String(subdomain).trim().toLowerCase() : "";
  return [safeTenantId, safeDomain, safeSubdomain].join("|");
};

export const getCachedPublicBrandingTheme = ({ tenantId, domain, subdomain } = {}) => {
  const cacheKey = buildPublicBrandingCacheKey({ tenantId, domain, subdomain });
  return readPublicBrandingCache(cacheKey);
};

const buildAuthBrandingCacheKey = ({ scope, tenantId } = {}) => {
  const safeScope = scope ? String(scope).trim().toLowerCase() : "unknown";
  const safeTenantId = tenantId ? String(tenantId).trim() : "";
  return [safeScope, safeTenantId].join("|");
};

const readAuthBrandingCache = (cacheKey) => {
  if (!cacheKey || typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(`${AUTH_BRANDING_CACHE_PREFIX}${cacheKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.value ?? null;
  } catch (error) {
    return null;
  }
};

const writeAuthBrandingCache = (cacheKey, value) => {
  if (!cacheKey || typeof window === "undefined") {
    return;
  }

  try {
    const payload = {
      value,
      storedAt: Date.now(),
    };
    window.localStorage.setItem(
      `${AUTH_BRANDING_CACHE_PREFIX}${cacheKey}`,
      JSON.stringify(payload)
    );
  } catch (error) {
    // Ignore storage failures (private mode, quota exceeded).
  }
};

const readPublicBrandingCache = (cacheKey) => {
  if (!cacheKey || typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(`${PUBLIC_BRANDING_CACHE_PREFIX}${cacheKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.value ?? null;
  } catch (error) {
    return null;
  }
};

const writePublicBrandingCache = (cacheKey, value) => {
  if (!cacheKey || typeof window === "undefined") {
    return;
  }

  try {
    const payload = {
      value,
      storedAt: Date.now(),
    };
    window.localStorage.setItem(
      `${PUBLIC_BRANDING_CACHE_PREFIX}${cacheKey}`,
      JSON.stringify(payload)
    );
  } catch (error) {
    // Ignore storage failures (private mode, quota exceeded).
  }
};

const fetchTenantBrandingTheme = async (tenantId) => {
  try {
    const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
    const res = await silentApi("GET", `/settings/profile/branding${query}`);
    if (!res?.data?.branding) {
      return mapBrandingPayload();
    }
    return mapBrandingPayload(res.data.branding);
  } catch (error) {
    if (isMissingBrandingRoute(error)) {
      return mapBrandingPayload();
    }
    throw error;
  }
};

const buildBrandingQuery = ({ tenantId, domain, subdomain } = {}) => {
  const params = new URLSearchParams();
  if (tenantId) {
    params.set("tenant_id", tenantId);
  }
  if (domain) {
    params.set("domain", domain);
  }
  if (subdomain) {
    params.set("subdomain", subdomain);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
};

const fetchPublicBrandingTheme = async ({ tenantId, domain, subdomain } = {}) => {
  try {
    const query = buildBrandingQuery({ tenantId, domain, subdomain });
    const res = await silentApi("GET", `/branding${query}`);
    if (!res?.data?.branding) {
      return mapBrandingPayload();
    }
    return mapBrandingPayload(res.data.branding);
  } catch (error) {
    if (isMissingBrandingRoute(error)) {
      return mapBrandingPayload();
    }
    throw error;
  }
};

const fetchClientBrandingTheme = async (tenantId) => {
  try {
    const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
    const res = await clientSilentApi("GET", `/settings/profile/branding${query}`);
    if (!res?.data?.branding) {
      return mapBrandingPayload();
    }
    return mapBrandingPayload(res.data.branding);
  } catch (error) {
    if (isMissingBrandingRoute(error)) {
      return mapBrandingPayload();
    }
    throw error;
  }
};

const fetchAdminBrandingTheme = async () => {
  try {
    const res = await adminSilentSettingsApi("GET", "/settings/profile/branding");
    if (!res?.data?.branding) {
      return mapBrandingPayload();
    }
    return mapBrandingPayload(res.data.branding);
  } catch (error) {
    if (isMissingBrandingRoute(error)) {
      return mapBrandingPayload();
    }
    throw error;
  }
};

export const usePublicBrandingTheme = ({ tenantId, domain, subdomain } = {}, options = {}) => {
  const cacheKey = buildPublicBrandingCacheKey({ tenantId, domain, subdomain });
  const cachedBranding = readPublicBrandingCache(cacheKey);
  const { onSuccess, ...restOptions } = options;

  const query = useQuery({
    queryKey: ["branding-theme", "public", tenantId ?? null, domain ?? null, subdomain ?? null],
    queryFn: () => fetchPublicBrandingTheme({ tenantId, domain, subdomain }),
    initialData: cachedBranding ?? undefined,
    initialDataUpdatedAt: cachedBranding ? 0 : undefined,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      if (cacheKey) {
        writePublicBrandingCache(cacheKey, data);
      }
      if (typeof onSuccess === "function") {
        onSuccess(data);
      }
    },
    ...restOptions,
  });

  return {
    ...query,
    data: resolveEffectiveBrandingTheme(query.data, DEFAULT_BRANDING_THEME),
  };
};

export const usePlatformBrandingTheme = (options = {}) => {
  return usePublicBrandingTheme({}, options);
};

export const useTenantBrandingTheme = (options = {}) => {
  const tenant = useTenantAuthStore((state) => state?.tenant);
  const tenantId = resolveTenantId(tenant);
  const cacheKey = buildAuthBrandingCacheKey({ scope: "tenant", tenantId });
  const cachedBranding = readAuthBrandingCache(cacheKey);
  const { enabled = true, onSuccess, ...restOptions } = options;
  const tenantQuery = useQuery({
    queryKey: ["branding-theme", "tenant", tenantId ?? null],
    queryFn: () => fetchTenantBrandingTheme(tenantId),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled,
    initialData: cachedBranding ?? undefined,
    initialDataUpdatedAt: cachedBranding ? 0 : undefined,
    onSuccess: (data) => {
      if (cacheKey) {
        writeAuthBrandingCache(cacheKey, data);
      }
      if (typeof onSuccess === "function") {
        onSuccess(data);
      }
    },
    ...restOptions,
  });
  const fallbackQuery = usePlatformBrandingTheme({
    enabled: enabled && (tenantQuery.data?.isFallback || tenantQuery.isError),
  });
  const useFallback =
    enabled && (!tenantQuery.data || tenantQuery.data.isFallback || tenantQuery.isError);

  return {
    ...tenantQuery,
    data: resolveEffectiveBrandingTheme(tenantQuery.data, fallbackQuery.data),
    isFetching: tenantQuery.isFetching || (useFallback ? fallbackQuery.isFetching : false),
    isLoading: tenantQuery.isLoading || (useFallback ? fallbackQuery.isLoading : false),
    isError: tenantQuery.isError || (useFallback ? fallbackQuery.isError : false),
    error: tenantQuery.error ?? (useFallback ? fallbackQuery.error : undefined),
  };
};

export const useAdminBrandingTheme = (options = {}) => {
  const cacheKey = buildAuthBrandingCacheKey({ scope: "admin" });
  const cachedBranding = readAuthBrandingCache(cacheKey);
  const { onSuccess, ...restOptions } = options;
  return useQuery({
    queryKey: ["branding-theme", "admin"],
    queryFn: fetchAdminBrandingTheme,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    initialData: cachedBranding ?? undefined,
    initialDataUpdatedAt: cachedBranding ? 0 : undefined,
    onSuccess: (data) => {
      if (cacheKey) {
        writeAuthBrandingCache(cacheKey, data);
      }
      if (typeof onSuccess === "function") {
        onSuccess(data);
      }
    },
    ...restOptions,
  });
};

export const useClientBrandingTheme = (options = {}) => {
  const tenant = useClientAuthStore((state) => state?.tenant);
  const tenantId = resolveTenantId(tenant);
  const cacheKey = buildAuthBrandingCacheKey({ scope: "client", tenantId });
  const cachedBranding = readAuthBrandingCache(cacheKey);
  const { onSuccess, ...restOptions } = options;
  return useQuery({
    queryKey: ["branding-theme", "client", tenantId ?? null],
    queryFn: () => fetchClientBrandingTheme(tenantId),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    initialData: cachedBranding ?? undefined,
    initialDataUpdatedAt: cachedBranding ? 0 : undefined,
    onSuccess: (data) => {
      if (cacheKey) {
        writeAuthBrandingCache(cacheKey, data);
      }
      if (typeof onSuccess === "function") {
        onSuccess(data);
      }
    },
    ...restOptions,
  });
};

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== "string") {
    return `rgba(40, 141, 209, ${alpha})`;
  }

  let normalized = hex.replace("#", "").trim();
  if (normalized.length === 3) {
    normalized = `${normalized[0]}${normalized[0]}${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}`;
  }

  if (normalized.length !== 6 || Number.isNaN(parseInt(normalized, 16))) {
    return `rgba(40, 141, 209, ${alpha})`;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const hexToRgb = (hex) => {
  if (!hex || typeof hex !== "string") {
    return null;
  }

  let normalized = hex.replace("#", "").trim();
  if (normalized.length === 3) {
    normalized = `${normalized[0]}${normalized[0]}${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}`;
  }

  if (normalized.length !== 6 || Number.isNaN(parseInt(normalized, 16))) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const normalizeTextColor = (value, fallback) => {
  if (!value || typeof value !== "string") {
    return fallback;
  }
  const rgb = hexToRgb(value);
  if (!rgb) {
    return fallback;
  }
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  if (luminance > 0.7) {
    return fallback;
  }
  return value;
};

const mixRgb = (base, target, weight) => ({
  r: Math.round(base.r + (target.r - base.r) * weight),
  g: Math.round(base.g + (target.g - base.g) * weight),
  b: Math.round(base.b + (target.b - base.b) * weight),
});

const rgbToChannels = (rgb) => `${rgb.r} ${rgb.g} ${rgb.b}`;

export const lockMarketingTheme = (theme = {}) => ({
  ...theme,
  accentColor: "#3FE0C8",
  primaryColor: "#288DD1",
  palette: {
    ...theme?.palette,
    text: "#6B7280",
    muted: "#6B7280",
    border: "rgba(63, 224, 200, 0.2)",
  },
});

export const resolveBrandLogo = (theme, fallbackLogo) => {
  const rawCandidate =
    normalizeLogoValue(theme?.logo) ??
    normalizeLogoValue(theme?.company?.logo) ??
    normalizeLogoValue(theme?.brand?.logo);

  if (isBlankLogoValue(rawCandidate)) {
    return fallbackLogo ?? null;
  }

  const normalized = rawCandidate.toLowerCase();
  if (normalized.includes(DEFAULT_LOGO_PATH)) {
    return fallbackLogo ?? null;
  }

  if (isAbsoluteLogoUrl(rawCandidate)) {
    return rawCandidate;
  }

  const apiBase = import.meta.env.VITE_API_USER_BASE_URL || "";
  if (!apiBase) {
    return rawCandidate;
  }

  return joinUrl(apiBase, rawCandidate);
};

let initialFaviconHref;
const resolveInitialFavicon = () => {
  if (typeof document === "undefined") {
    return null;
  }
  if (initialFaviconHref !== undefined) {
    return initialFaviconHref;
  }

  const favicon = document.querySelector("link[rel='icon']");
  initialFaviconHref = favicon?.href || null;
  return initialFaviconHref;
};

export const applyBrandingToCss = (theme, { fallbackLogo, updateFavicon = false } = {}) => {
  const accent = theme?.accentColor ?? DEFAULT_ACCENT;
  const primary = theme?.primaryColor ?? DEFAULT_PRIMARY;
  const palette = theme?.palette ?? {};
  const accentRgb = hexToRgb(accent) ?? { r: 40, g: 141, b: 209 };
  const primaryRgb = hexToRgb(primary) ?? { r: 63, g: 224, b: 200 };
  const textColor = normalizeTextColor(palette.text, "#6B7280");
  const mutedColor = normalizeTextColor(palette.muted, textColor);

  const root = document.documentElement;
  root.style.setProperty("--theme-color", accent);
  root.style.setProperty("--secondary-color", primary);
  root.style.setProperty("--theme-color-rgb", rgbToChannels(accentRgb));
  root.style.setProperty("--secondary-color-rgb", rgbToChannels(primaryRgb));
  root.style.setProperty("--theme-color-10", hexToRgba(accent, 0.08));
  root.style.setProperty("--theme-color-20", hexToRgba(accent, 0.18));
  root.style.setProperty("--theme-border-color", palette.border ?? hexToRgba(primary, 0.2));
  root.style.setProperty("--theme-card-bg", palette.card_bg ?? "#FFFFFF");
  root.style.setProperty("--theme-surface-alt", palette.surface_alt ?? "#F3F4F6");
  root.style.setProperty("--theme-heading-color", "#111827");
  root.style.setProperty("--theme-text-color", textColor);
  root.style.setProperty("--theme-muted-color", mutedColor);
  root.style.setProperty(
    "--theme-badge-success-bg",
    palette.badge_success_bg ?? hexToRgba(accent, 0.2)
  );
  root.style.setProperty("--theme-badge-success-text", palette.badge_success_text ?? accent);
  root.style.setProperty("--theme-badge-pending-bg", palette.badge_pending_bg ?? "#FEF3C7");
  root.style.setProperty("--theme-badge-pending-text", palette.badge_pending_text ?? "#92400E");
  root.style.setProperty("--theme-badge-failed-bg", palette.badge_failed_bg ?? "#FEE2E2");
  root.style.setProperty("--theme-badge-failed-text", palette.badge_failed_text ?? "#B91C1C");
  root.style.setProperty("--theme-tag-bg", palette.tag_bg ?? hexToRgba(accent, 0.16));
  root.style.setProperty("--theme-tag-text", palette.tag_text ?? accent);
  root.style.setProperty(
    "--theme-color-50",
    rgbToChannels(mixRgb(accentRgb, { r: 255, g: 255, b: 255 }, 0.92))
  );
  root.style.setProperty(
    "--theme-color-100",
    rgbToChannels(mixRgb(accentRgb, { r: 255, g: 255, b: 255 }, 0.84))
  );
  root.style.setProperty(
    "--theme-color-200",
    rgbToChannels(mixRgb(accentRgb, { r: 255, g: 255, b: 255 }, 0.72))
  );
  root.style.setProperty(
    "--theme-color-300",
    rgbToChannels(mixRgb(accentRgb, { r: 255, g: 255, b: 255 }, 0.56))
  );
  root.style.setProperty(
    "--theme-color-400",
    rgbToChannels(mixRgb(accentRgb, { r: 255, g: 255, b: 255 }, 0.32))
  );
  root.style.setProperty("--theme-color-500", rgbToChannels(accentRgb));
  root.style.setProperty(
    "--theme-color-600",
    rgbToChannels(mixRgb(accentRgb, { r: 0, g: 0, b: 0 }, 0.18))
  );
  root.style.setProperty(
    "--theme-color-700",
    rgbToChannels(mixRgb(accentRgb, { r: 0, g: 0, b: 0 }, 0.32))
  );
  root.style.setProperty(
    "--theme-color-800",
    rgbToChannels(mixRgb(accentRgb, { r: 0, g: 0, b: 0 }, 0.46))
  );
  root.style.setProperty(
    "--theme-color-900",
    rgbToChannels(mixRgb(accentRgb, { r: 0, g: 0, b: 0 }, 0.6))
  );

  if (updateFavicon) {
    const fallbackFavicon = resolveInitialFavicon();
    const faviconSource = theme?.favicon ?? fallbackFavicon ?? null;
    if (faviconSource) {
      const faviconSelectors = ["link[rel='icon']", "link[rel='shortcut icon']"];
      faviconSelectors.forEach((selector) => {
        const favicon = document.querySelector(selector);
        if (favicon) {
          // Create a temporary anchor to resolve relative paths to absolute
          const tempAnchor = document.createElement("a");
          tempAnchor.href = faviconSource;
          const fullyQualifiedFavicon = tempAnchor.href;

          if (favicon.href !== fullyQualifiedFavicon) {
            favicon.href = fullyQualifiedFavicon;
          }
        }
      });
    }
  }
};

export const useApplyBrandingTheme = (theme, options = {}) => {
  const { fallbackLogo, enabled = true, updateFavicon = false } = options;
  const useSyncEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

  useSyncEffect(() => {
    if (!enabled) return;
    applyBrandingToCss(theme, { fallbackLogo, updateFavicon });
  }, [theme, fallbackLogo, enabled, updateFavicon]);
};
