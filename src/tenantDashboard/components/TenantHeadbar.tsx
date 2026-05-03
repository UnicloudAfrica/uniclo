import React from "react";
import { DashboardHeadbar } from "@/shared/components/headbar";
import { useDashboardProfile } from "@/shared/hooks/useDashboardProfile";
import useSidebarStore from "@/stores/sidebarStore";
import { buildTenantHeadbarPreset } from "@/shared/config/headbarPresets";
import { resolveBrandLogo, useTenantBrandingTheme } from "@/hooks/useBrandingTheme";
import { tenantMenuItems } from "@/shared/config/sidebarMenus";
import { useMenuPaletteItems } from "@/shared/components/command-palette/useMenuPaletteItems";

interface TenantHeadbarProps {
  tenantData?: {
    name?: string;
    logo?: string;
    color?: string;
    [key: string]: unknown;
  };
  onMenuClick?: () => void;
}

const TenantHeadbar: React.FC<TenantHeadbarProps> = ({ tenantData, onMenuClick }) => {
  const { profile, isFetching: isProfileFetching } = useDashboardProfile("tenant");
  const { toggleMobile } = useSidebarStore();
  const { data: branding } = useTenantBrandingTheme();
  const resolvedTenantData = {
    name: branding?.company?.name || tenantData?.name,
    logo: resolveBrandLogo(branding, tenantData?.logo as string | undefined),
    color: branding?.accentColor || tenantData?.color,
  };
  const preset = buildTenantHeadbarPreset(resolvedTenantData as never);

  const handleMobileMenuToggle = () => {
    toggleMobile();
    onMenuClick?.();
  };

  const searchItems = useMenuPaletteItems(tenantMenuItems);

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
      searchItems={searchItems}
    />
  );
};

export default TenantHeadbar;
