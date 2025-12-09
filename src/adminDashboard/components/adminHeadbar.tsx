// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeadbar } from "../../shared/components/headbar";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { clearAllAuthSessions } from "../../stores/sessionUtils";
import useSidebarStore from "../../stores/sidebarStore";
import logo from "./assets/logo.png";

const AdminHeadbar: React.FC = () => {
  const navigate = useNavigate();
  const clearUserEmail = useAdminAuthStore((state) => state.clearUserEmail);
  const { toggleMobile } = useSidebarStore();

  const handleLogout = async () => {
    try {
      // Admin logout API call would go here
      // await lapapi("POST", "/business/auth/logout");
    } catch (error) {
      console.error("Admin logout failed:", error);
    } finally {
      clearAllAuthSessions();
      clearUserEmail?.();
      navigate("/admin-signin");
    }
  };

  return (
    <DashboardHeadbar
      dashboardType="admin"
      onMobileMenuToggle={toggleMobile}
      userProfile={{
        initials: "AD",
        email: "admin@unicloudafrica.com",
        firstName: "Admin",
        lastName: "User",
      }}
      logo={{
        src: logo,
        alt: "UniCloud Admin Portal",
        link: "/admin-dashboard",
      }}
      onLogout={handleLogout}
      logoutPath="/admin-signin"
      profilePath="/admin-dashboard/profile-settings"
      showNotifications={true}
      showHelp={true}
      helpPath="/admin-dashboard/support-ticket"
    />
  );
};

export default AdminHeadbar;
