// @ts-nocheck
import React from "react";
import { DashboardHeadbar } from "../../shared/components/headbar";
import { useDashboardProfile } from "../../shared/hooks/useDashboardProfile";
import useClientTheme from "../../hooks/clientHooks/useClientTheme";
import useSidebarStore from "../../stores/sidebarStore";
import { buildClientHeadbarPreset } from "../../shared/config/headbarPresets";

interface ClientHeadbarProps {
  onMenuClick?: () => void;
}

const ClientHeadbar: React.FC<ClientHeadbarProps> = ({ onMenuClick }) => {
  const { profile, isFetching: isProfileFetching } = useDashboardProfile("client");
  const { data: theme, isLoading: isThemeLoading } = useClientTheme();
  const { toggleMobile } = useSidebarStore();
  const preset = buildClientHeadbarPreset(theme);

  const handleMobileMenuToggle = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      toggleMobile();
    }
  };

  return (
    <DashboardHeadbar
      {...preset}
      onMobileMenuToggle={handleMobileMenuToggle}
      userProfile={{
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        initials: profile.initials,
        avatar: profile.avatar,
      }}
      isProfileLoading={isProfileFetching}
      isThemeLoading={isThemeLoading}
    />
  );
};

export default ClientHeadbar;
