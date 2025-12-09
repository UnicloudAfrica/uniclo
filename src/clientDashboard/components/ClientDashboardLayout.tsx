// @ts-nocheck
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Headbar from "./clientHeadbar";
import Sidebar from "./clientSidebar";
import useClientTheme from "../../hooks/clientHooks/useClientTheme";
import { useApplyBrandingTheme } from "../../hooks/useBrandingTheme";
import useClientAuthStore from "../../stores/clientAuthStore";

const ClientDashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const token = useClientAuthStore((s) => s.token);
  const hasHydrated = useClientAuthStore((s) => s.hasHydrated);
  const { data: theme, isFetching } = useClientTheme({
    enabled: Boolean(token) && hasHydrated,
  });

  useApplyBrandingTheme(theme?.branding, {
    fallbackLogo: theme?.businessLogoHref,
  });

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      <Outlet />
    </>
  );
};

export default ClientDashboardLayout;
