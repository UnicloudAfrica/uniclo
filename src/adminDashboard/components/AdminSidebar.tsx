import React from "react";
import useAdminAuthStore from "@/stores/adminAuthStore";
import useAuthStore from "@/stores/authStore";
import { logoutActiveSession } from "@/stores/sessionUtils";
import { DashboardSidebar } from "@/shared/components/sidebar";
import { adminMenuItems, filterMenuByPermissions } from "@/shared/config/sidebarMenus";
import { useNavigate } from "react-router-dom";
import useSidebarStore from "@/stores/sidebarStore";
import { useAdminBrandingTheme } from "@/hooks/useBrandingTheme";
import { useAdminShellContext } from "./AdminShellContext";
import logger from "@/utils/logger";

interface AdminSidebarProps {
  forceRender?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ forceRender = false }) => {
  const { isActive } = useAdminShellContext();
  const shouldRender = forceRender || !isActive;
  const navigate = useNavigate();
  const clearUserEmail = useAdminAuthStore((state) => state.clearUserEmail);
  const { isMobileOpen, closeMobile } = useSidebarStore();
  const permissions = useAuthStore((s) => s.permissions);
  const { data: branding } = useAdminBrandingTheme({ enabled: shouldRender });
  const themeColor = branding?.accentColor || branding?.primaryColor;

  const filteredItems = React.useMemo(
    () => filterMenuByPermissions(adminMenuItems, permissions),
    [permissions]
  );

  if (!shouldRender) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logoutActiveSession();
    } catch (error) {
      logger.error("Admin logout failed:", error);
    } finally {
      clearUserEmail?.();
      closeMobile();
      navigate("/admin-signin");
    }
  };

  return (
    <DashboardSidebar
      menuItems={filteredItems}
      sidebarLabel="ADMIN"
      logoutPath="/admin-signin"
      themeColor={themeColor}
      isMobileMenuOpen={isMobileOpen}
      onCloseMobileMenu={closeMobile}
      onLogout={handleLogout}
      userProfile={{
        initials: "AD",
        email: "admin@email.com",
        firstName: "Admin",
      }}
      regionStatus={{
        code: "NG-1",
        label: "Lagos",
        detail: "Sovereign · 99.99% SLA",
        status: "operational",
      }}
    />
  );
};

export default AdminSidebar;
