import { useEffect, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import silentApi from "../index/silent";
import clientSilentApi from "../index/client/silent";
import adminSilentSettingsApi from "../index/admin/silentSettingsApi";
import useClientAuthStore from "../stores/clientAuthStore";
import useTenantAuthStore from "../stores/tenantAuthStore";
import { BrandingTheme, BrandingCompany, BrandingPalette } from "../types/branding";

// Default colors pulled from the platform marketing palette.
const DEFAULT_ACCENT = "#288DD1"; // UniCloud blue (global default)
const DEFAULT_PRIMARY = "#3FE0C8"; // UniCloud teal (secondary default)
const LEGACY_PLATFORM_ACCENT = "#1c1c1c";
const LEGACY_PLATFORM_PRIMARY = "#14547f";

const DEFAULT_LOGO_PATH = "assets/images/logo.png";
const LOGO_URL_PREFIXES = ["data:", "blob:", "http://", "https://", "//"];

type BrandingPalettePayload = Record<string, unknown> & {
  accent?: string;
  primary?: string;
};

type BrandingBrandPayload = Record<string, unknown> & {
  palette?: BrandingPalettePayload;
  accent_color?: string;
  primary_color?: string;
  logo?: unknown;
  logo_url?: unknown;
  favicon?: unknown;
};

type BrandingCompanyPayload = Record<string, unknown> & {
  name?: string;
  logo?: unknown;
  logo_url?: unknown;
  favicon?: unknown;
  logo_href?: string;
  website?: string;
  support_url?: string;
  accent_color?: string;
  primary_color?: string;
};

type BrandingPayload = Record<string, unknown> & {
  logo?: unknown;
  favicon?: unknown;
  logo_href?: string;
  brand?: BrandingBrandPayload;
  company?: BrandingCompanyPayload;
};

type BrandingQueryOptions = Partial<
  Omit<
    UseQueryOptions<BrandingTheme, Error, BrandingTheme, readonly unknown[]>,
    "queryKey" | "queryFn"
  >
> & {
  onSuccess?: (data: BrandingTheme) => void;
};

type BrandingResponse = {
  data?: {
    branding?: BrandingPayload;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";
const normalizeHex = (value: string | null | undefined) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeLogoValue = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "string") return value.trim();
  if (isRecord(value) && typeof value.url === "string") {
    return value.url.trim();
  }
  return null;
};

const isBlankLogoValue = (value: unknown) => {
  if (!value) return true;
  const normalized = String(value).trim().toLowerCase();
  return !normalized || normalized === "null" || normalized === "undefined";
};

const isDefaultLogoValue = (value: unknown) => {
  if (isBlankLogoValue(value)) return true;
  const normalized = String(value).trim().toLowerCase();
  return normalized.includes(DEFAULT_LOGO_PATH);
};

const isAbsoluteLogoUrl = (value: string) =>
  LOGO_URL_PREFIXES.some((prefix) => value.toLowerCase().startsWith(prefix));

const joinUrl = (base: string, path: string) => {
  const normalizedBase = String(base).replace(/\/+$/, "");
  const normalizedPath = String(path).replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
};

const resolveTenantId = (tenant: unknown): string | number | null => {
  if (!isRecord(tenant)) return null;
  const raw = tenant.id || tenant.identifier || tenant.tenant_id || tenant.uuid || null;
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string" || typeof raw === "number") return raw;
  return String(raw);
};

export const getTenantId = resolveTenantId;

const isLegacyPlatformPalette = (accentColor: string, primaryColor: string) => {
  return (
    normalizeHex(accentColor) === LEGACY_PLATFORM_ACCENT &&
    normalizeHex(primaryColor) === LEGACY_PLATFORM_PRIMARY
  );
};

export const mapBrandingPayload = (payload: BrandingPayload = {}): BrandingTheme => {
  const brand = isRecord(payload.brand) ? (payload.brand as BrandingBrandPayload) : {};
  const company = isRecord(payload.company) ? (payload.company as BrandingCompanyPayload) : {};
  const palette = isRecord(brand.palette) ? (brand.palette as BrandingPalettePayload) : {};
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
    company: company as BrandingCompany,
    brand,
    palette: palette as BrandingPalette,
    accentColor,
    primaryColor,
    hasCustomBranding,
    isLegacyPlatformTheme,
    isFallback: !hasCustomBranding,
    raw: payload,
  };
};

const DEFAULT_BRANDING_THEME = mapBrandingPayload();

const shouldFallbackTheme = (theme: BrandingTheme | null) => !theme || theme.isFallback;

export const resolveEffectiveBrandingTheme = (
  theme: BrandingTheme | null,
  fallbackTheme: BrandingTheme | null
) => {
  if (!shouldFallbackTheme(theme)) {
    return theme;
  }
  return fallbackTheme ?? theme ?? null;
};

const isMissingBrandingRoute = (error: unknown) => {
  if (!error) return false;
  const message = String((error as { message?: unknown })?.message ?? error).toLowerCase();
  return message.includes("could not be found") || message.includes("not found");
};

const PUBLIC_BRANDING_CACHE_PREFIX = "public-branding:v2:";
const AUTH_BRANDING_CACHE_PREFIX = "auth-branding:v1:";

const buildPublicBrandingCacheKey = ({
  tenantId,
  domain,
  subdomain,
}: { tenantId?: string | number; domain?: string; subdomain?: string } = {}) => {
  const safeTenantId = tenantId ? String(tenantId).trim() : "";
  const safeDomain = domain ? String(domain).trim().toLowerCase() : "";
  const safeSubdomain = subdomain ? String(subdomain).trim().toLowerCase() : "";
  return [safeTenantId, safeDomain, safeSubdomain].join("|");
};

export const getCachedPublicBrandingTheme = ({
  tenantId,
  domain,
  subdomain,
}: { tenantId?: string | number; domain?: string; subdomain?: string } = {}) => {
  const cacheKey = buildPublicBrandingCacheKey({ tenantId, domain, subdomain });
  return readPublicBrandingCache(cacheKey);
};

const buildAuthBrandingCacheKey = ({
  scope,
  tenantId,
}: { scope?: string; tenantId?: string | number } = {}) => {
  const safeScope = scope ? String(scope).trim().toLowerCase() : "unknown";
  const safeTenantId = tenantId ? String(tenantId).trim() : "";
  return [safeScope, safeTenantId].join("|");
};

const readAuthBrandingCache = (cacheKey: string) => {
  if (!cacheKey || typeof window === "undefined") {
    return null;
  }

  try {
    const raw = globalThis.window.localStorage.getItem(`${AUTH_BRANDING_CACHE_PREFIX}${cacheKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed?.value as BrandingTheme) ?? null;
  } catch {
    return null;
  }
};

const writeAuthBrandingCache = (cacheKey: string, value: BrandingTheme) => {
  if (!cacheKey || typeof window === "undefined") {
    return;
  }

  try {
    const payload = {
      value,
      storedAt: Date.now(),
    };
    globalThis.window.localStorage.setItem(
      `${AUTH_BRANDING_CACHE_PREFIX}${cacheKey}`,
      JSON.stringify(payload)
    );
  } catch {
    // Ignore storage failures
  }
};

const readPublicBrandingCache = (cacheKey: string) => {
  if (!cacheKey || typeof window === "undefined") {
    return null;
  }

  try {
    const raw = globalThis.window.localStorage.getItem(
      `${PUBLIC_BRANDING_CACHE_PREFIX}${cacheKey}`
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed?.value as BrandingTheme) ?? null;
  } catch {
    return null;
  }
};

const writePublicBrandingCache = (cacheKey: string, value: BrandingTheme) => {
  if (!cacheKey || typeof window === "undefined") {
    return;
  }

  try {
    const payload = {
      value,
      storedAt: Date.now(),
    };
    globalThis.window.localStorage.setItem(
      `${PUBLIC_BRANDING_CACHE_PREFIX}${cacheKey}`,
      JSON.stringify(payload)
    );
  } catch {
    // Ignore storage failures
  }
};

const fetchTenantBrandingTheme = async (tenantId: string | number | null) => {
  try {
    const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
    const res = await silentApi<BrandingResponse>("GET", `/settings/profile/branding${query}`);
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

const buildBrandingQuery = ({
  tenantId,
  domain,
  subdomain,
}: { tenantId?: string | number; domain?: string; subdomain?: string } = {}) => {
  const params = new URLSearchParams();
  if (tenantId) {
    params.set("tenant_id", String(tenantId));
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

const fetchPublicBrandingTheme = async ({
  tenantId,
  domain,
  subdomain,
}: { tenantId?: string | number; domain?: string; subdomain?: string } = {}) => {
  try {
    const query = buildBrandingQuery({ tenantId, domain, subdomain });
    const res = await silentApi<BrandingResponse>("GET", `/branding${query}`);
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

const fetchClientBrandingTheme = async (tenantId: string | number | null) => {
  try {
    const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
    const res = await clientSilentApi<BrandingResponse>(
      "GET",
      `/settings/profile/branding${query}`
    );
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
    const res = await adminSilentSettingsApi<BrandingResponse>("GET", "/settings/profile/branding");
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

export const usePublicBrandingTheme = (
  {
    tenantId,
    domain,
    subdomain,
  }: { tenantId?: string | number; domain?: string; subdomain?: string } = {},
  options: BrandingQueryOptions = {}
) => {
  const cacheKey = buildPublicBrandingCacheKey({ tenantId, domain, subdomain });
  const cachedBranding = readPublicBrandingCache(cacheKey);
  const isBrowser = typeof window !== "undefined";
  const { onSuccess, enabled = isBrowser, ...restOptions } = options;

  const query = useQuery<BrandingTheme>({
    queryKey: ["branding-theme", "public", tenantId ?? null, domain ?? null, subdomain ?? null],
    queryFn: () => fetchPublicBrandingTheme({ tenantId, domain, subdomain }),
    initialData: cachedBranding ?? undefined,
    initialDataUpdatedAt: cachedBranding ? 0 : undefined,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled,
    ...restOptions,
  });

  useEffect(() => {
    if (query.data && cacheKey) {
      writePublicBrandingCache(cacheKey, query.data);
      if (typeof onSuccess === "function") {
        onSuccess(query.data);
      }
    }
  }, [query.data, cacheKey, onSuccess]);

  return {
    ...query,
    data: resolveEffectiveBrandingTheme(
      query.data ?? null,
      DEFAULT_BRANDING_THEME
    ) as BrandingTheme,
  };
};

export const usePlatformBrandingTheme = (options: BrandingQueryOptions = {}) => {
  return usePublicBrandingTheme({}, options);
};

export const useTenantBrandingTheme = (options: BrandingQueryOptions = {}) => {
  const tenant = useTenantAuthStore((state) => state.tenant);
  const tenantId = resolveTenantId(tenant);
  const cacheKey = buildAuthBrandingCacheKey({ scope: "tenant", tenantId: tenantId ?? undefined });
  const cachedBranding = readAuthBrandingCache(cacheKey);
  const { enabled = true, onSuccess, ...restOptions } = options;
  const tenantQuery = useQuery<BrandingTheme>({
    queryKey: ["branding-theme", "tenant", tenantId ?? null],
    queryFn: () => fetchTenantBrandingTheme(tenantId),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled,
    initialData: cachedBranding ?? undefined,
    initialDataUpdatedAt: cachedBranding ? 0 : undefined,
    ...restOptions,
  });

  useEffect(() => {
    if (tenantQuery.data && cacheKey) {
      writeAuthBrandingCache(cacheKey, tenantQuery.data);
      if (typeof onSuccess === "function") {
        onSuccess(tenantQuery.data);
      }
    }
  }, [tenantQuery.data, cacheKey, onSuccess]);

  const fallbackQuery = usePlatformBrandingTheme({
    enabled: enabled && (tenantQuery.data?.isFallback || tenantQuery.isError),
  });
  const useFallback =
    enabled && (!tenantQuery.data || tenantQuery.data.isFallback || tenantQuery.isError);

  return {
    ...tenantQuery,
    data: resolveEffectiveBrandingTheme(
      tenantQuery.data ?? null,
      fallbackQuery.data ?? null
    ) as BrandingTheme,
    isFetching: tenantQuery.isFetching || (useFallback ? fallbackQuery.isFetching : false),
    isLoading: tenantQuery.isLoading || (useFallback ? fallbackQuery.isLoading : false),
    isError: tenantQuery.isError || (useFallback ? fallbackQuery.isError : false),
    error: tenantQuery.error ?? (useFallback ? fallbackQuery.error : undefined),
  };
};

export const useAdminBrandingTheme = (options: BrandingQueryOptions = {}) => {
  const cacheKey = buildAuthBrandingCacheKey({ scope: "admin" });
  const cachedBranding = readAuthBrandingCache(cacheKey);
  const { onSuccess, ...restOptions } = options;
  const query = useQuery<BrandingTheme>({
    queryKey: ["branding-theme", "admin"],
    queryFn: fetchAdminBrandingTheme,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    initialData: cachedBranding ?? undefined,
    initialDataUpdatedAt: cachedBranding ? 0 : undefined,
    ...restOptions,
  });

  useEffect(() => {
    if (query.data && cacheKey) {
      writeAuthBrandingCache(cacheKey, query.data);
      if (typeof onSuccess === "function") {
        onSuccess(query.data);
      }
    }
  }, [query.data, cacheKey, onSuccess]);

  return query;
};

export const useClientBrandingTheme = (options: BrandingQueryOptions = {}) => {
  const tenant = useClientAuthStore((state) => state.tenant);
  const tenantId = resolveTenantId(tenant);
  const cacheKey = buildAuthBrandingCacheKey({ scope: "client", tenantId: tenantId ?? undefined });
  const cachedBranding = readAuthBrandingCache(cacheKey);
  const { onSuccess, ...restOptions } = options;
  const query = useQuery<BrandingTheme>({
    queryKey: ["branding-theme", "client", tenantId ?? null],
    queryFn: () => fetchClientBrandingTheme(tenantId),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    initialData: cachedBranding ?? undefined,
    initialDataUpdatedAt: cachedBranding ? 0 : undefined,
    ...restOptions,
  });

  useEffect(() => {
    if (query.data && cacheKey) {
      writeAuthBrandingCache(cacheKey, query.data);
      if (typeof onSuccess === "function") {
        onSuccess(query.data);
      }
    }
  }, [query.data, cacheKey, onSuccess]);

  return query;
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

const DEFAULT_ACCENT_RGB: RgbColor = { r: 40, g: 141, b: 209 };
const DEFAULT_PRIMARY_RGB: RgbColor = { r: 63, g: 224, b: 200 };
const DEFAULT_SUCCESS_HEX = "#22C55E";
const DEFAULT_WARNING_HEX = "#F59E0B";
const DEFAULT_DANGER_HEX = "#EF4444";
const FALLBACK_TEXT_COLOR = "#4B5563";
const FALLBACK_HEADING_COLOR = "#111827";
const FALLBACK_SURFACE_COLOR = "#FFFFFF";
const FALLBACK_NEUTRAL_SCALE: Record<number, string> = {
  50: "249 250 251",
  100: "243 244 246",
  200: "229 231 235",
  300: "209 213 219",
  400: "156 163 175",
  500: "107 114 128",
  600: "75 85 99",
  700: "55 65 81",
  800: "31 41 55",
  900: "17 24 39",
};

const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const parseHexToRgb = (hex: string) => {
  if (!hex || typeof hex !== "string") {
    return null;
  }

  let normalized = hex.replace("#", "").trim();
  if (normalized.length === 3) {
    normalized = `${normalized[0]}${normalized[0]}${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}`;
  }

  if (normalized.length !== 6 || Number.isNaN(Number.parseInt(normalized, 16))) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const parseRgbString = (value: string) => {
  const match = value
    .trim()
    .match(/^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,/]\s*[\d.]+\s*)?\)$/i);
  if (!match) return null;
  return {
    r: clampChannel(Number(match[1])),
    g: clampChannel(Number(match[2])),
    b: clampChannel(Number(match[3])),
  };
};

const colorToRgb = (value: string | undefined | null): RgbColor | null => {
  if (!value || typeof value !== "string") {
    return null;
  }
  return parseHexToRgb(value) ?? parseRgbString(value);
};

const hexToRgba = (hex: string, alpha: number) => {
  const rgb = colorToRgb(hex) ?? DEFAULT_ACCENT_RGB;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const toLinearChannel = (channel: number) => {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (rgb: RgbColor) =>
  0.2126 * toLinearChannel(rgb.r) +
  0.7152 * toLinearChannel(rgb.g) +
  0.0722 * toLinearChannel(rgb.b);

const contrastRatio = (a: RgbColor, b: RgbColor) => {
  const luminanceA = relativeLuminance(a);
  const luminanceB = relativeLuminance(b);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
};

const normalizeTextColor = (
  value: string | undefined,
  fallback: string,
  backgroundColor = FALLBACK_SURFACE_COLOR,
  minContrast = 4.5
) => {
  if (!value || typeof value !== "string") {
    return fallback;
  }
  const rgb = colorToRgb(value);
  const fallbackRgb = colorToRgb(fallback);
  const backgroundRgb = colorToRgb(backgroundColor);
  if (!rgb || !fallbackRgb || !backgroundRgb) {
    return fallback;
  }
  return contrastRatio(rgb, backgroundRgb) >= minContrast ? value : fallback;
};

const mixRgb = (base: RgbColor, target: RgbColor, weight: number): RgbColor => ({
  r: clampChannel(base.r + (target.r - base.r) * weight),
  g: clampChannel(base.g + (target.g - base.g) * weight),
  b: clampChannel(base.b + (target.b - base.b) * weight),
});

const rgbToChannels = (rgb: RgbColor) => `${rgb.r} ${rgb.g} ${rgb.b}`;
const rgbToCss = (rgb: RgbColor) => `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
const colorDistance = (a: RgbColor, b: RgbColor) =>
  Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);

const resolveOnColor = (background: RgbColor) => {
  const light = { r: 255, g: 255, b: 255 };
  const dark = { r: 17, g: 24, b: 39 };
  const lightContrast = contrastRatio(background, light);
  const darkContrast = contrastRatio(background, dark);
  return lightContrast >= darkContrast ? "#FFFFFF" : "#111827";
};

export const lockMarketingTheme = (theme: BrandingTheme | null = null): BrandingTheme => {
  const base = theme ?? mapBrandingPayload();
  return {
    ...base,
    accentColor: "#3FE0C8",
    primaryColor: "#288DD1",
    palette: {
      ...base.palette,
      text: "#6B7280",
      muted: "#6B7280",
      border: "rgba(63, 224, 200, 0.2)",
    },
  };
};

export const resolveBrandLogo = (theme: BrandingTheme | null, fallbackLogo: string | null) => {
  const rawCandidate =
    normalizeLogoValue(theme?.logo) ??
    normalizeLogoValue(theme?.company?.logo) ??
    normalizeLogoValue(theme?.brand?.logo);

  if (isBlankLogoValue(rawCandidate) || !rawCandidate) {
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

let initialFaviconHref: string | null | undefined;
const resolveInitialFavicon = () => {
  if (typeof document === "undefined") {
    return null;
  }
  if (initialFaviconHref !== undefined) {
    return initialFaviconHref;
  }

  const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
  initialFaviconHref = favicon?.href || null;
  return initialFaviconHref;
};

export const applyBrandingToCss = (
  theme: BrandingTheme | null,
  { updateFavicon = false }: { fallbackLogo?: string | null; updateFavicon?: boolean } = {}
) => {
  const accent = theme?.accentColor ?? DEFAULT_ACCENT;
  const primary = theme?.primaryColor ?? DEFAULT_PRIMARY;
  const palette = theme?.palette ?? {};
  const accentRgb = colorToRgb(accent) ?? DEFAULT_ACCENT_RGB;
  const primaryRgb = colorToRgb(primary) ?? DEFAULT_PRIMARY_RGB;
  const surfaceColor = isNonEmptyString(palette.card_bg) ? palette.card_bg : FALLBACK_SURFACE_COLOR;
  const surfaceAltColor = isNonEmptyString(palette.surface_alt) ? palette.surface_alt : "#F3F4F6";
  const textColor = normalizeTextColor(palette.text, FALLBACK_TEXT_COLOR, surfaceColor, 4.5);
  const mutedColor = normalizeTextColor(palette.muted, textColor, surfaceColor, 3.2);
  const headingColor = normalizeTextColor(palette.heading, FALLBACK_HEADING_COLOR, surfaceColor, 7);
  const resolvePaletteValue = (key: string, fallback: string) => {
    const value = palette[key];
    return isNonEmptyString(value) ? value : fallback;
  };
  const inputBgColor = resolvePaletteValue("input_bg", surfaceColor);
  const inputTextColor = normalizeTextColor(
    resolvePaletteValue("input_text", headingColor),
    headingColor,
    inputBgColor,
    4.5
  );
  const inputPlaceholderColor = normalizeTextColor(
    resolvePaletteValue("input_placeholder", mutedColor),
    mutedColor,
    inputBgColor,
    3
  );
  const resolvePaletteColor = (value: string | undefined, fallback: string) =>
    isNonEmptyString(value) ? value : fallback;
  const isDistinct = colorDistance(accentRgb, primaryRgb) >= 40;
  const onAccent = resolveOnColor(accentRgb);
  const onSecondary = resolveOnColor(primaryRgb);

  const root = document.documentElement;
  root.style.setProperty("--theme-color", accent);
  root.style.setProperty("--secondary-color", primary);
  root.style.setProperty("--theme-color-rgb", rgbToChannels(accentRgb));
  root.style.setProperty("--secondary-color-rgb", rgbToChannels(primaryRgb));
  root.style.setProperty("--theme-color-10", hexToRgba(accent, 0.08));
  root.style.setProperty("--theme-color-20", hexToRgba(accent, 0.18));
  root.style.setProperty("--secondary-color-10", hexToRgba(primary, 0.08));
  root.style.setProperty("--secondary-color-20", hexToRgba(primary, 0.18));
  root.style.setProperty("--theme-hero-start", accent);
  root.style.setProperty(
    "--theme-hero-end",
    isDistinct ? primary : rgbToCss(mixRgb(accentRgb, { r: 0, g: 0, b: 0 }, 0.38))
  );
  root.style.setProperty("--theme-border-color", palette.border ?? hexToRgba(primary, 0.2));
  root.style.setProperty("--theme-card-bg", surfaceColor);
  root.style.setProperty("--theme-surface-alt", surfaceAltColor);
  root.style.setProperty("--theme-heading-color", headingColor);
  root.style.setProperty("--theme-text-color", textColor);
  root.style.setProperty("--theme-muted-color", mutedColor);
  root.style.setProperty("--theme-tag-bg", palette.tag_bg ?? hexToRgba(accent, 0.16));
  root.style.setProperty(
    "--theme-tag-text",
    normalizeTextColor(palette.tag_text, accent, palette.tag_bg ?? hexToRgba(accent, 0.16), 3)
  );
  root.style.setProperty("--theme-on-color", onAccent);
  root.style.setProperty("--theme-on-secondary", onSecondary);
  root.style.setProperty("--theme-focus-ring", hexToRgba(accent, 0.34));
  root.style.setProperty("--theme-button-primary-bg", accent);
  root.style.setProperty("--theme-button-primary-text", onAccent);
  root.style.setProperty("--theme-button-secondary-bg", primary);
  root.style.setProperty("--theme-button-secondary-text", onSecondary);
  root.style.setProperty("--theme-input-bg", inputBgColor);
  root.style.setProperty(
    "--theme-input-border",
    resolvePaletteValue("input_border", "rgb(var(--theme-neutral-300))")
  );
  root.style.setProperty(
    "--theme-input-hover-border",
    resolvePaletteValue("input_hover_border", "rgb(var(--theme-neutral-400))")
  );
  root.style.setProperty("--theme-input-text", inputTextColor);
  root.style.setProperty("--theme-input-placeholder", inputPlaceholderColor);
  root.style.setProperty("--surface-page", "var(--theme-surface-alt)");
  root.style.setProperty("--surface-card", "var(--theme-card-bg)");
  root.style.setProperty("--text-primary", "var(--theme-heading-color)");
  root.style.setProperty("--text-secondary", "var(--theme-text-color)");
  root.style.setProperty("--text-muted", "var(--theme-muted-color)");
  root.style.setProperty("--border-default", "var(--theme-border-color)");
  Object.entries(FALLBACK_NEUTRAL_SCALE).forEach(([shade, channels]) => {
    root.style.setProperty(`--theme-neutral-${shade}`, channels);
  });
  // Keep light surfaces neutral to avoid brand tinting across layouts.
  root.style.setProperty("--theme-color-50", "249 250 251");
  root.style.setProperty("--theme-color-100", "243 244 246");
  root.style.setProperty("--theme-color-200", "229 231 235");
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

  const successHex = resolvePaletteColor(
    palette.success ?? palette.badge_success_text,
    DEFAULT_SUCCESS_HEX
  );
  const warningHex = resolvePaletteColor(
    palette.warning ?? palette.badge_pending_text,
    DEFAULT_WARNING_HEX
  );
  const dangerHex = resolvePaletteColor(
    palette.danger ?? palette.badge_failed_text,
    DEFAULT_DANGER_HEX
  );
  const successRgb = colorToRgb(successHex) ?? primaryRgb;
  const warningRgb = colorToRgb(warningHex) ?? accentRgb;
  const dangerRgb = colorToRgb(dangerHex) ?? accentRgb;

  const setScale = (
    prefix: string,
    baseRgb: { r: number; g: number; b: number },
    options: { neutralLow?: boolean } = {}
  ) => {
    const { neutralLow = true } = options;
    if (neutralLow) {
      root.style.setProperty(`--${prefix}-50`, "249 250 251");
      root.style.setProperty(`--${prefix}-100`, "243 244 246");
      root.style.setProperty(`--${prefix}-200`, "229 231 235");
    } else {
      root.style.setProperty(
        `--${prefix}-50`,
        rgbToChannels(mixRgb(baseRgb, { r: 255, g: 255, b: 255 }, 0.92))
      );
      root.style.setProperty(
        `--${prefix}-100`,
        rgbToChannels(mixRgb(baseRgb, { r: 255, g: 255, b: 255 }, 0.85))
      );
      root.style.setProperty(
        `--${prefix}-200`,
        rgbToChannels(mixRgb(baseRgb, { r: 255, g: 255, b: 255 }, 0.72))
      );
    }
    root.style.setProperty(
      `--${prefix}-300`,
      rgbToChannels(mixRgb(baseRgb, { r: 255, g: 255, b: 255 }, 0.56))
    );
    root.style.setProperty(
      `--${prefix}-400`,
      rgbToChannels(mixRgb(baseRgb, { r: 255, g: 255, b: 255 }, 0.32))
    );
    root.style.setProperty(`--${prefix}-500`, rgbToChannels(baseRgb));
    root.style.setProperty(
      `--${prefix}-600`,
      rgbToChannels(mixRgb(baseRgb, { r: 0, g: 0, b: 0 }, 0.18))
    );
    root.style.setProperty(
      `--${prefix}-700`,
      rgbToChannels(mixRgb(baseRgb, { r: 0, g: 0, b: 0 }, 0.32))
    );
    root.style.setProperty(
      `--${prefix}-800`,
      rgbToChannels(mixRgb(baseRgb, { r: 0, g: 0, b: 0 }, 0.46))
    );
    root.style.setProperty(
      `--${prefix}-900`,
      rgbToChannels(mixRgb(baseRgb, { r: 0, g: 0, b: 0 }, 0.6))
    );
  };

  setScale("secondary-color", primaryRgb, { neutralLow: true });
  root.style.setProperty("--theme-success-rgb", rgbToChannels(successRgb));
  root.style.setProperty("--theme-warning-rgb", rgbToChannels(warningRgb));
  root.style.setProperty("--theme-danger-rgb", rgbToChannels(dangerRgb));
  setScale("theme-success", successRgb, { neutralLow: false });
  setScale("theme-warning", warningRgb, { neutralLow: false });
  setScale("theme-danger", dangerRgb, { neutralLow: false });

  root.style.setProperty(
    "--theme-badge-success-bg",
    palette.badge_success_bg ?? hexToRgba(successHex, 0.2)
  );
  root.style.setProperty(
    "--theme-badge-success-text",
    normalizeTextColor(
      palette.badge_success_text,
      successHex,
      palette.badge_success_bg ?? hexToRgba(successHex, 0.2),
      3
    )
  );
  root.style.setProperty(
    "--theme-badge-pending-bg",
    palette.badge_pending_bg ?? hexToRgba(warningHex, 0.16)
  );
  root.style.setProperty(
    "--theme-badge-pending-text",
    normalizeTextColor(
      palette.badge_pending_text,
      warningHex,
      palette.badge_pending_bg ?? hexToRgba(warningHex, 0.16),
      3
    )
  );
  root.style.setProperty(
    "--theme-badge-failed-bg",
    palette.badge_failed_bg ?? hexToRgba(dangerHex, 0.2)
  );
  root.style.setProperty(
    "--theme-badge-failed-text",
    normalizeTextColor(
      palette.badge_failed_text,
      dangerHex,
      palette.badge_failed_bg ?? hexToRgba(dangerHex, 0.2),
      3
    )
  );

  if (updateFavicon) {
    const fallbackFavicon = resolveInitialFavicon();
    const faviconSource = theme?.favicon ?? fallbackFavicon ?? null;
    if (faviconSource) {
      const faviconSelectors = ["link[rel='icon']", "link[rel='shortcut icon']"];
      faviconSelectors.forEach((selector) => {
        const favicon = document.querySelector(selector) as HTMLLinkElement;
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

export const useApplyBrandingTheme = (
  theme: BrandingTheme | null,
  options: { fallbackLogo?: string | null; enabled?: boolean; updateFavicon?: boolean } = {}
) => {
  const { fallbackLogo, enabled = true, updateFavicon = false } = options;
  const useSyncEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

  useSyncEffect(() => {
    if (!enabled) return;
    applyBrandingToCss(theme, { fallbackLogo, updateFavicon });
  }, [theme, fallbackLogo, enabled, updateFavicon]);
};
