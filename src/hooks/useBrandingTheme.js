import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import silentApi from "../index/silent";
import clientSilentApi from "../index/client/silent";

// Default colors matching admin dashboard's neutral scheme
// Using black/dark colors instead of bright cyan/blue until tenant customizes
const DEFAULT_ACCENT = "#1C1C1C"; // Black (matches admin active states)
const DEFAULT_PRIMARY = "#14547F"; // Dark blue (matches admin mobile drawer)

const mapBrandingPayload = (payload = {}) => {
  const brand = payload.brand ?? {};
  const company = payload.company ?? {};
  const palette = brand.palette ?? {};

  const accentColor =
    palette.accent ?? brand.accent_color ?? company.accent_color ?? DEFAULT_ACCENT;
  const primaryColor =
    palette.primary ?? brand.primary_color ?? company.primary_color ?? DEFAULT_PRIMARY;

  return {
    logo: payload.logo ?? null,
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

const fetchClientBrandingTheme = async () => {
  try {
    const res = await clientSilentApi("GET", "/settings/profile/branding");
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

export const useClientBrandingTheme = (options = {}) => {
  return useQuery({
    queryKey: ["branding-theme", "client"],
    queryFn: fetchClientBrandingTheme,
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

export const applyBrandingToCss = (theme, { fallbackLogo } = {}) => {
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

  const logoForFavicon = theme?.logo ?? fallbackLogo ?? null;
  if (logoForFavicon) {
    const faviconSelectors = ["link[rel='icon']", "link[rel='shortcut icon']"];
    faviconSelectors.forEach((selector) => {
      const favicon = document.querySelector(selector);
      if (favicon && favicon.href !== logoForFavicon) {
        favicon.href = logoForFavicon;
      }
    });
  }
};

export const useApplyBrandingTheme = (theme, options = {}) => {
  const { fallbackLogo } = options;

  useEffect(() => {
    applyBrandingToCss(theme, { fallbackLogo });
  }, [theme, fallbackLogo]);
};
