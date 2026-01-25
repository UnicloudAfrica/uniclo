// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeadbar } from "../../shared/components/headbar";
import { useDashboardProfile } from "../../shared/hooks/useDashboardProfile";
import { clearAllAuthSessions } from "../../stores/sessionUtils";
import useSidebarStore from "../../stores/sidebarStore";
import { buildAdminHeadbarPreset } from "../../shared/config/headbarPresets";
import {
  resolveBrandLogo,
  useAdminBrandingTheme,
  useApplyBrandingTheme,
} from "../../hooks/useBrandingTheme";
import logo from "./assets/logo.png";
import { useAdminShellContext } from "./AdminShellContext";

interface AdminHeadbarProps {
  forceRender?: boolean;
}

const AdminHeadbar: React.FC<AdminHeadbarProps> = ({ forceRender = false }) => {
  const { isActive } = useAdminShellContext();
  const shouldRender = forceRender || !isActive;
  const navigate = useNavigate();
  const { profile, isFetching: isProfileFetching } = useDashboardProfile("admin", {
    enabled: shouldRender,
  });
  const { toggleMobile } = useSidebarStore();
  const { data: branding, isFetching: isBrandingFetching } = useAdminBrandingTheme({
    enabled: shouldRender,
  });
  useApplyBrandingTheme(branding, { fallbackLogo: logo, enabled: shouldRender });

  const preset = buildAdminHeadbarPreset(
    resolveBrandLogo(branding, logo),
    branding?.accentColor || branding?.primaryColor
  );

  if (!shouldRender) {
    return null;
  }

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
      {...preset}
      onMobileMenuToggle={toggleMobile}
      userProfile={{
        initials: profile.initials,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
      }}
      onLogout={handleLogout}
      isProfileLoading={isProfileFetching}
      isThemeLoading={isBrandingFetching}
    />
  );
};

export default AdminHeadbar;
