import { useEffect, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import silentApi from "../index/silent";
import clientSilentApi from "../index/client/silent";
import adminSilentApi from "../index/admin/silent";
import useClientAuthStore from "../stores/clientAuthStore";

// Default colors matching admin dashboard's neutral scheme
// Using black/dark colors instead of bright cyan/blue until tenant customizes
const DEFAULT_ACCENT = "#1C1C1C"; // Black (matches admin active states)
const DEFAULT_PRIMARY = "#14547F"; // Dark blue (matches admin mobile drawer)

const mapBrandingPayload = (payload = {}) => {
  const brand = payload.brand ?? {};
  const company = payload.company ?? {};
  const palette = brand.palette ?? {};
  const favicon = payload.favicon ?? brand.favicon ?? company.favicon ?? null;

  const accentColor =
    palette.accent ?? brand.accent_color ?? company.accent_color ?? DEFAULT_ACCENT;
  const primaryColor =
    palette.primary ?? brand.primary_color ?? company.primary_color ?? DEFAULT_PRIMARY;

  return {
    logo: payload.logo ?? null,
    favicon,
    logoHref:
      payload.logo_href ?? company.logo_href ?? company.website ?? company.support_url ?? null,
    company,
    brand,
    palette,
    accentColor,
    primaryColor,
    raw: payload,
  };
};

const isMissingBrandingRoute = (error) => {
  if (!error) return false;
  const message = String(error.message || error).toLowerCase();
  return message.includes("could not be found") || message.includes("not found");
};

const PUBLIC_BRANDING_CACHE_PREFIX = "public-branding:v1:";

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

const fetchTenantBrandingTheme = async () => {
  try {
    const res = await silentApi("GET", "/settings/profile/branding");
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
    const res = await adminSilentApi("GET", "/settings/profile/branding");
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

export const useTenantBrandingTheme = (options = {}) => {
  return useQuery({
    queryKey: ["branding-theme", "tenant"],
    queryFn: fetchTenantBrandingTheme,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const usePublicBrandingTheme = ({ tenantId, domain, subdomain } = {}, options = {}) => {
  const cacheKey = buildPublicBrandingCacheKey({ tenantId, domain, subdomain });
  const cachedBranding = readPublicBrandingCache(cacheKey);
  const { onSuccess, ...restOptions } = options;

  return useQuery({
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
};

export const useAdminBrandingTheme = (options = {}) => {
  return useQuery({
    queryKey: ["branding-theme", "admin"],
    queryFn: fetchAdminBrandingTheme,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useClientBrandingTheme = (options = {}) => {
  const tenant = useClientAuthStore((state) => state?.tenant);
  const tenantId = tenant?.id || tenant?.identifier || tenant?.tenant_id || tenant?.uuid || null;
  return useQuery({
    queryKey: ["branding-theme", "client", tenantId],
    queryFn: () => fetchClientBrandingTheme(tenantId),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
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

const DEFAULT_LOGO_PATH = "/assets/images/logo.png";

export const resolveBrandLogo = (theme, fallbackLogo) => {
  const candidate = theme?.logo ?? null;
  if (!candidate) {
    return fallbackLogo ?? null;
  }

  const normalized = String(candidate).toLowerCase();
  if (normalized.includes(DEFAULT_LOGO_PATH)) {
    return fallbackLogo ?? candidate;
  }

  return candidate;
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

  const root = document.documentElement;
  root.style.setProperty("--theme-color", accent);
  root.style.setProperty("--secondary-color", primary);
  root.style.setProperty("--theme-color-10", hexToRgba(accent, 0.08));
  root.style.setProperty("--theme-color-20", hexToRgba(accent, 0.18));
  root.style.setProperty("--theme-border-color", palette.border ?? hexToRgba(primary, 0.2));
  root.style.setProperty("--theme-card-bg", palette.card_bg ?? "#FFFFFF");
  root.style.setProperty("--theme-surface-alt", palette.surface_alt ?? "#F3F4F6");
  root.style.setProperty("--theme-heading-color", "#111827");
  root.style.setProperty("--theme-text-color", palette.text ?? "#1F2937");
  root.style.setProperty("--theme-muted-color", palette.muted ?? "#6B7280");
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
