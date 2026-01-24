import type { DashboardHeadbarProps } from "../components/headbar/DashboardHeadbar";
import adminLogo from "../../adminDashboard/components/assets/logo.png";

type HeadbarPreset = Pick<
  DashboardHeadbarProps,
  | "dashboardType"
  | "logoutPath"
  | "profilePath"
  | "helpPath"
  | "showHelp"
  | "showNotifications"
  | "themeColor"
  | "logo"
>;

const basePresets = {
  admin: {
    dashboardType: "admin",
    logoutPath: "/admin-signin",
    profilePath: "/admin-dashboard/account",
    helpPath: "/admin-dashboard/tickets",
    showHelp: true,
    showNotifications: true,
  },
  tenant: {
    dashboardType: "tenant",
    logoutPath: "/tenant-signin",
    profilePath: "/dashboard/account",
    helpPath: "/tenant-dashboard/support-ticket",
    showHelp: true,
    showNotifications: true,
  },
  client: {
    dashboardType: "client",
    logoutPath: "/sign-in",
    profilePath: "/client-dashboard/account-settings",
    helpPath: "/client-dashboard/support",
    showHelp: true,
    showNotifications: true,
  },
} as const;

export const buildAdminHeadbarPreset = (logoSrc: string, themeColor?: string): HeadbarPreset => ({
  ...basePresets.admin,
  themeColor,
  logo: {
    src: logoSrc,
    alt: "UniCloud Admin Portal",
    link: "/admin-dashboard",
    fallbackSrc: adminLogo,
  },
});

export const buildTenantHeadbarPreset = (tenantData?: {
  name?: string;
  logo?: string;
  color?: string;
}): HeadbarPreset => ({
  ...basePresets.tenant,
  themeColor: tenantData?.color || "#14547F",
  logo: {
    src: tenantData?.logo || adminLogo,
    alt: `${tenantData?.name || "Tenant"} Logo`,
    link: "/dashboard",
    className: "w-[71px] h-[54px]",
    fallbackSrc: adminLogo,
  },
});

export const buildClientHeadbarPreset = (theme?: {
  businessLogoHref?: string;
  businessLogoLink?: string;
  company?: { name?: string };
}): HeadbarPreset => ({
  ...basePresets.client,
  logo: {
    src: theme?.businessLogoHref || adminLogo,
    alt: theme?.company?.name ? `${theme.company.name} Logo` : "Client Portal Logo",
    link: theme?.businessLogoLink || "/client-dashboard",
    className: "w-auto h-[54px] max-w-[160px] object-contain",
    fallbackSrc: adminLogo,
  },
});
