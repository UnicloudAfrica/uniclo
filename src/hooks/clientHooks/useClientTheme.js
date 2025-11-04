import { useClientBrandingTheme } from "../useBrandingTheme";

const FALLBACK_LOGO =
  "https://dummyimage.com/150x50/e5e7eb/6b7280.png&text=Client+Logo";

const mapBrandingToClientTheme = (branding) => {
  if (!branding) {
    return {
      businessLogoHref: FALLBACK_LOGO,
      businessLogoLink: null,
      themeColor: "#288DD1",
      secondaryColor: "#3272CA",
      palette: {},
      company: {},
      branding: null,
    };
  }

  return {
    businessLogoHref: branding.logo ?? FALLBACK_LOGO,
    businessLogoLink: branding.logoHref ?? null,
    themeColor: branding.accentColor ?? "#288DD1",
    secondaryColor: branding.primaryColor ?? "#3272CA",
    palette: branding.palette ?? {},
    company: branding.company ?? {},
    branding,
  };
};

const useClientTheme = (options = {}) => {
  const query = useClientBrandingTheme(options);
  return {
    ...query,
    data: mapBrandingToClientTheme(query.data),
  };
};

export default useClientTheme;
