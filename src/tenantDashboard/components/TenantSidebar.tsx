import React from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/stores/authStore";
import { logoutActiveSession } from "@/stores/sessionUtils";
import { DashboardSidebar } from "@/shared/components/sidebar";
import { tenantMenuItems, filterMenuByPermissions } from "@/shared/config/sidebarMenus";
import useSidebarStore from "@/stores/sidebarStore";
import logger from "@/utils/logger";

interface TenantData {
  name?: string;
  logo?: string;
  color?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
}

interface TenantSidebarProps {
  tenantData?: TenantData;
}

const TenantSidebar: React.FC<TenantSidebarProps> = ({ tenantData }) => {
  const navigate = useNavigate();
  const permissions = useAuthStore((s) => s.permissions);
  const { isMobileOpen, closeMobile } = useSidebarStore();

  const themeColor = tenantData?.color || "var(--theme-color)";

  const filteredItems = React.useMemo(
    () => filterMenuByPermissions(tenantMenuItems, permissions),
    [permissions]
  );

  const handleLogout = async () => {
    try {
      await logoutActiveSession();
      closeMobile();
      navigate("/tenant-signin");
    } catch (error) {
      logger.error("Failed to logout:", error);
    }
  };

  return (
    <DashboardSidebar
      menuItems={filteredItems}
      sidebarLabel="TENANT"
      themeColor={themeColor}
      logoutPath="/tenant-signin"
      isMobileMenuOpen={isMobileOpen}
      onCloseMobileMenu={closeMobile}
      onLogout={handleLogout}
      userProfile={{
        email: tenantData?.email,
        firstName: tenantData?.first_name,
        lastName: tenantData?.last_name,
      }}
    />
  );
};

export default TenantSidebar;
