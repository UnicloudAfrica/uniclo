// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import { clearAllAuthSessions } from "../../stores/sessionUtils";
import { DashboardSidebar } from "../../shared/components/sidebar";
import { tenantMenuItems } from "../../shared/config/sidebarMenus";
import useSidebarStore from "../../stores/sidebarStore";

interface TenantData {
  name?: string;
  logo?: string;
  color?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

interface TenantSidebarProps {
  tenantData?: TenantData;
}

const TenantSidebar: React.FC<TenantSidebarProps> = ({ tenantData }) => {
  const navigate = useNavigate();
  const { isMobileOpen, closeMobile } = useSidebarStore();

  const themeColor = tenantData?.color || "#288DD1";

  const handleLogout = async () => {
    try {
      clearAllAuthSessions();
      closeMobile();
      navigate("/tenant-signin");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <DashboardSidebar
      menuItems={tenantMenuItems}
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
