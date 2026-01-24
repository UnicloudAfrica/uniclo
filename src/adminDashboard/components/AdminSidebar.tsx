// @ts-nocheck
import React from "react";
import lapapi from "../../index/admin/lapapi";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { clearAllAuthSessions } from "../../stores/sessionUtils";
import { DashboardSidebar } from "../../shared/components/sidebar";
import { adminMenuItems } from "../../shared/config/sidebarMenus";
import { useNavigate } from "react-router-dom";
import useSidebarStore from "../../stores/sidebarStore";
import { useAdminBrandingTheme } from "../../hooks/useBrandingTheme";
import { useAdminShellContext } from "./AdminShellContext";

interface AdminSidebarProps {
  forceRender?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ forceRender = false }) => {
  const { isActive } = useAdminShellContext();
  const shouldRender = forceRender || !isActive;
  const navigate = useNavigate();
  const clearUserEmail = useAdminAuthStore((state) => state.clearUserEmail);
  const { isMobileOpen, closeMobile } = useSidebarStore();
  const { data: branding } = useAdminBrandingTheme({ enabled: shouldRender });
  const themeColor = branding?.accentColor || branding?.primaryColor;

  if (!shouldRender) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await lapapi("POST", "/business/auth/logout");
    } catch (error) {
      console.error("Admin logout failed:", error);
    } finally {
      clearAllAuthSessions();
      clearUserEmail?.();
      closeMobile();
      navigate("/admin-signin");
    }
  };

  return (
    <DashboardSidebar
      menuItems={adminMenuItems}
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
    />
  );
};

export default AdminSidebar;
