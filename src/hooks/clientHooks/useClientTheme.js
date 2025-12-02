import { useMemo } from "react";
import { useClientBrandingTheme } from "../useBrandingTheme";

const FALLBACK_LOGO =
  "https://dummyimage.com/150x50/e5e7eb/6b7280.png&text=Client+Logo";

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

  const themeColor = branding.accentColor ?? "#1C1C1C";
  const secondaryColor = branding.primaryColor ?? "#14547F";

  // Known old default colors to override (case-insensitive)
  const OLD_DEFAULTS = ["#288DD1", "#3272CA", "#00A8E8", "#00AAFF"];

  const isOldDefault = (color) => {
    if (!color) return false;
    return OLD_DEFAULTS.some(old => old.toLowerCase() === color.toLowerCase());
  };

  // Override old defaults if they come from the API
  const finalThemeColor = isOldDefault(themeColor) ? "#1C1C1C" : themeColor;
  const finalSecondaryColor = isOldDefault(secondaryColor) ? "#14547F" : secondaryColor;

  return {
    businessLogoHref: branding.logo ?? FALLBACK_LOGO,
    businessLogoLink: branding.logoHref ?? null,
    themeColor: finalThemeColor,
    secondaryColor: finalSecondaryColor,
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
