export interface BrandingPalette {
  accent?: string;
  primary?: string;
  text?: string;
  muted?: string;
  heading?: string;
  border?: string;
  card_bg?: string;
  surface_alt?: string;
  badge_success_bg?: string;
  badge_success_text?: string;
  badge_pending_bg?: string;
  badge_pending_text?: string;
  badge_failed_bg?: string;
  badge_failed_text?: string;
  tag_bg?: string;
  tag_text?: string;
  [key: string]: string | undefined;
}

export interface BrandingCompany {
  name?: string;
  logo?: string;
  [key: string]: unknown;
}

export interface BrandingTheme {
  logo: string | null;
  favicon: string | null;
  logoHref: string | null;
  company: BrandingCompany;
  brand: Record<string, unknown>;
  palette: BrandingPalette;
  accentColor: string;
  primaryColor: string;
  hasCustomBranding: boolean;
  isLegacyPlatformTheme: boolean;
  isFallback: boolean;
  raw: BrandingPayload;
  [key: string]: unknown;
}

export interface BrandingPayload {
  logo?: string | null;
  favicon?: string | null;
  logo_href?: string | null;
  brand?: {
    palette?: BrandingPalette;
    accent_color?: string;
    primary_color?: string;
    logo?: string | null;
    favicon?: string | null;
  };
  company?: BrandingCompany & {
    logo_url?: string | null;
    favicon_url?: string | null;
  };
}

export interface BrandingResponse {
  data?: {
    branding?: BrandingPayload;
  };
  resolved?: BrandingTheme;
}

export interface ClientTheme {
  businessLogoHref: string;
  businessLogoLink?: string;
  themeColor: string;
  secondaryColor: string;
  palette: BrandingPalette;
  company: {
    name?: string;
    logo?: string;
  };
  branding: BrandingTheme | null;
}
