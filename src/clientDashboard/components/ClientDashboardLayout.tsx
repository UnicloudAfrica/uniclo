import { useState } from "react";
import { Outlet } from "react-router-dom";
import Headbar from "./clientHeadbar";
import Sidebar from "./clientSidebar";
import useClientTheme from "@/hooks/clientHooks/useClientTheme";
import { useApplyBrandingTheme } from "@/hooks/useBrandingTheme";
import useClientAuthStore from "@/stores/clientAuthStore";
import { ClientTheme } from "@/types/branding";
import { AuthState } from "@/types/auth";

const ClientDashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAuthenticated = useClientAuthStore((s: AuthState) => s.isAuthenticated);
  const hasHydrated = useClientAuthStore((s: AuthState) => s.hasHydrated);
  const { data: theme } = useClientTheme({
    enabled: isAuthenticated && hasHydrated,
  }) as { data: ClientTheme };

  useApplyBrandingTheme(theme?.branding, {
    fallbackLogo: theme?.businessLogoHref,
    updateFavicon: true,
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
