// @ts-nocheck
import React from "react";
import { DashboardHeadbar } from "../../shared/components/headbar";
import { useDashboardProfile } from "../../shared/hooks/useDashboardProfile";
import useSidebarStore from "../../stores/sidebarStore";

interface TenantHeadbarProps {
  tenantData?: {
    name?: string;
    logo?: string;
    color?: string;
    [key: string]: any;
  };
  onMenuClick?: () => void;
}

const TenantHeadbar: React.FC<TenantHeadbarProps> = ({ tenantData, onMenuClick }) => {
  const { profile, isFetching: isProfileFetching } = useDashboardProfile("tenant");
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
      dashboardType="tenant"
      onMobileMenuToggle={handleMobileMenuToggle}
      userProfile={{
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        initials: profile.initials,
        avatar: profile.avatar,
      }}
      logo={{
        src: tenantData?.logo || "/logo.svg",
        alt: `${tenantData?.name || "Tenant"} Logo`,
        link: "/dashboard",
        className: "w-[71px] h-[54px]",
      }}
      themeColor={tenantData?.color || "#14547F"}
      logoutPath="/tenant-signin"
      profilePath="/tenant-dashboard/app-settings"
      showNotifications={true}
      showHelp={true}
      helpPath="/tenant-dashboard/support-ticket"
      isProfileLoading={isProfileFetching}
    />
  );
};

export default TenantHeadbar;
