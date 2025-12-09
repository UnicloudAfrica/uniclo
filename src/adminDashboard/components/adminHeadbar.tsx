// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeadbar } from "../../shared/components/headbar";
import { useDashboardProfile } from "../../shared/hooks/useDashboardProfile";
import { clearAllAuthSessions } from "../../stores/sessionUtils";
import useSidebarStore from "../../stores/sidebarStore";
import logo from "./assets/logo.png";

const AdminHeadbar: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isFetching: isProfileFetching } = useDashboardProfile("admin");
  const { toggleMobile } = useSidebarStore();

  const handleLogout = async () => {
    try {
      // Admin logout API call would go here
      // await adminApi.post("/logout");
    } catch (error) {
      console.error("Admin logout failed:", error);
    } finally {
      clearAllAuthSessions();
      navigate("/admin-signin");
    }
  };

  return (
    <DashboardHeadbar
      dashboardType="admin"
      onMobileMenuToggle={toggleMobile}
      userProfile={{
        initials: profile.initials,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
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
      helpPath="/admin-dashboard/tickets"
      isProfileLoading={isProfileFetching}
    />
  );
};

export default AdminHeadbar;
