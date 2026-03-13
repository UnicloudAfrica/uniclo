import { Outlet } from "react-router-dom";
import TenantHeadbar from "./TenantHeadbar";
import TenantSidebar from "./TenantSidebar";
import ActiveTab from "../../dashboard/components/activeTab";
import { useApplyBrandingTheme, useTenantBrandingTheme } from "@/hooks/useBrandingTheme";
import usePermissionRefresh from "@/hooks/usePermissionRefresh";

const TenantDashboardLayout = () => {
  usePermissionRefresh();
  const { data: theme } = useTenantBrandingTheme();
  useApplyBrandingTheme(theme, { fallbackLogo: theme?.logo, updateFavicon: true });

  const tenantData = {
    name: theme?.company?.name || "Tenant",
    logo: theme?.logo || "",
    color: theme?.accentColor || "var(--theme-color)",
  };

  return (
    <>
      <TenantHeadbar tenantData={tenantData} />
      <TenantSidebar tenantData={tenantData} />
      <ActiveTab />
      <Outlet />
    </>
  );
};

export default TenantDashboardLayout;
