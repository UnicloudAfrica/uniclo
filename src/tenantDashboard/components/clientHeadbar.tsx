// @ts-nocheck
import React from "react";
import { DashboardHeadbar } from "../../shared/components/headbar";
import { useFetchProfile } from "../../hooks/resource";
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

const TenantHeadbar: React.FC<TenantHeadbarProps> = ({ tenantData, onMenuClick }: any) => {
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();
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
        email: profile?.email,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
      }}
      logo={{
        src: tenantData?.logo || "/logo.png",
        alt: `${tenantData?.name || "Tenant"} Logo`,
        link: "/tenant-dashboard",
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
