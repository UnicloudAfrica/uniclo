import { useMemo } from "react";
import { useClientBrandingTheme } from "../useBrandingTheme";

const FALLBACK_LOGO = "https://dummyimage.com/150x50/e5e7eb/6b7280.png&text=Client+Logo";

const mapBrandingToClientTheme = (branding) => {
  if (!branding) {
    return {
      businessLogoHref: FALLBACK_LOGO,
      businessLogoLink: null,
      themeColor: "#1C1C1C", // Black - matches admin
      secondaryColor: "#14547F", // Dark blue - matches admin
      palette: {},
      company: {},
      branding: null,
    };
  }

  return {
    businessLogoHref: branding.logo ?? FALLBACK_LOGO,
    businessLogoLink: branding.logoHref ?? null,
    themeColor: branding.accentColor ?? "#1C1C1C",
    secondaryColor: branding.primaryColor ?? "#14547F",
    palette: branding.palette ?? {},
    company: branding.company ?? {},
    branding,
  };
};

const useClientTheme = (options = {}) => {
  const query = useClientBrandingTheme(options);
  const data = useMemo(() => mapBrandingToClientTheme(query.data), [query.data]);

  return {
    ...query,
    data,
  };
};

export default useClientTheme;
