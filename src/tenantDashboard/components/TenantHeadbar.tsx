// @ts-nocheck
import React from "react";
import { DashboardHeadbar } from "../../shared/components/headbar";
import { useDashboardProfile } from "../../shared/hooks/useDashboardProfile";
import useSidebarStore from "../../stores/sidebarStore";
import { buildTenantHeadbarPreset } from "../../shared/config/headbarPresets";
import {
  resolveBrandLogo,
  useApplyBrandingTheme,
  useTenantBrandingTheme,
} from "../../hooks/useBrandingTheme";

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
  const { data: branding } = useTenantBrandingTheme();
  useApplyBrandingTheme(branding, { fallbackLogo: tenantData?.logo, updateFavicon: true });
  const resolvedTenantData = {
    name: branding?.company?.name || tenantData?.name,
    logo: resolveBrandLogo(branding, tenantData?.logo),
    color: branding?.accentColor || tenantData?.color,
  };
  const preset = buildTenantHeadbarPreset(resolvedTenantData);

  const handleMobileMenuToggle = () => {
    toggleMobile();
    onMenuClick?.();
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
    />
  );
};

export default TenantHeadbar;
