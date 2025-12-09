// @ts-nocheck
import React from "react";
import { DashboardHeadbar } from "../../shared/components/headbar";
import { useDashboardProfile } from "../../shared/hooks/useDashboardProfile";
import useClientTheme from "../../hooks/clientHooks/useClientTheme";
import useSidebarStore from "../../stores/sidebarStore";
import logo from "./assets/logo.png";

interface ClientHeadbarProps {
  onMenuClick?: () => void;
}

const ClientHeadbar: React.FC<ClientHeadbarProps> = ({ onMenuClick }) => {
  const { profile, isFetching: isProfileFetching } = useDashboardProfile("client");
  const { data: theme, isFetching: isThemeFetching } = useClientTheme();
  const { toggleMobile } = useSidebarStore();

  const handleMobileMenuToggle = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      toggleMobile();
    }
  };

  return (
    <DashboardHeadbar
      dashboardType="client"
      onMobileMenuToggle={handleMobileMenuToggle}
      userProfile={{
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        initials: profile.initials,
        avatar: profile.avatar,
      }}
      logo={{
        src: theme?.businessLogoHref || logo,
        alt: theme?.company?.name ? `${theme.company.name} Logo` : "Client Portal Logo",
        link: theme?.businessLogoLink || "/client-dashboard",
        className: "w-auto h-[54px] max-w-[160px] object-contain",
      }}
      logoutPath="/sign-in"
      profilePath="/client-dashboard/account-settings"
      showNotifications={true}
      showHelp={true}
      helpPath="/client-dashboard/support"
      isProfileLoading={isProfileFetching}
      isThemeLoading={isThemeFetching}
    />
  );
};

export default ClientHeadbar;
