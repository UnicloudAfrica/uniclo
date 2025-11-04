import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Headbar from "./clientHeadbar";
import Sidebar from "./clientSidebar";
import useClientTheme from "../../hooks/clientHooks/useClientTheme";
import useClientAuthRedirect from "../../utils/clientAuthRedirect";
import { Loader2 } from "lucide-react";
import { useApplyBrandingTheme } from "../../hooks/useBrandingTheme";

const ClientDashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: theme } = useClientTheme();
  const { isLoading: isAuthLoading } = useClientAuthRedirect();

  useApplyBrandingTheme(theme?.branding, {
    fallbackLogo: theme?.businessLogoHref,
  });

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  if (isAuthLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 className="w-12 text-[--theme-color] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <Outlet />
    </>
  );
};

export default ClientDashboardLayout;
