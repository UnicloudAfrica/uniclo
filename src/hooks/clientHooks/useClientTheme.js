import { useMemo } from "react";
import useClientAuthStore from "../../stores/clientAuthStore";
import {
  getTenantId,
  resolveBrandLogo,
  resolveEffectiveBrandingTheme,
  useClientBrandingTheme,
  usePlatformBrandingTheme,
} from "../useBrandingTheme";

const FALLBACK_LOGO = "https://dummyimage.com/150x50/e5e7eb/6b7280.png&text=Client+Logo";

const mapBrandingToClientTheme = (branding) => {
  return {
    businessLogoHref: resolveBrandLogo(branding, FALLBACK_LOGO),
    businessLogoLink: branding?.logoHref ?? null,
    themeColor: branding?.accentColor ?? "#288DD1",
    secondaryColor: branding?.primaryColor ?? "#3FE0C8",
    palette: branding?.palette ?? {},
    company: branding?.company ?? {},
    branding: branding ?? null,
  };
};

const useClientTheme = (options = {}) => {
  const tenant = useClientAuthStore((state) => state?.tenant);
  const tenantId = getTenantId(tenant);
  const { enabled = true, ...restOptions } = options;
  const tenantQuery = useClientBrandingTheme({
    ...restOptions,
    enabled: enabled && Boolean(tenantId),
  });
  const fallbackQuery = usePlatformBrandingTheme({
    enabled: enabled && (!tenantId || tenantQuery.data?.isFallback || tenantQuery.isError),
  });
  const effectiveBranding = tenantId
    ? resolveEffectiveBrandingTheme(tenantQuery.data, fallbackQuery.data)
    : (fallbackQuery.data ?? tenantQuery.data);
  const data = useMemo(() => mapBrandingToClientTheme(effectiveBranding), [effectiveBranding]);
  const activeQuery = tenantId ? tenantQuery : fallbackQuery;

  return {
    ...activeQuery,
    data,
    isFetching: tenantQuery.isFetching || fallbackQuery.isFetching,
    isLoading: tenantQuery.isLoading || fallbackQuery.isLoading,
    isError: tenantQuery.isError || fallbackQuery.isError,
    error: tenantQuery.error ?? fallbackQuery.error,
  };
};

export default useClientTheme;
