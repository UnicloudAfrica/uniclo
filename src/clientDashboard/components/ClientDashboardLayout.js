import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Headbar from "./clientHeadbar";
import Sidebar from "./clientSidebar";
import useClientTheme from "../../hooks/clientHooks/useClientTheme";
import useClientAuthRedirect from "../../utils/clientAuthRedirect";
import { Loader2 } from "lucide-react";

const ClientDashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: theme } = useClientTheme();
  const { isLoading: isAuthLoading } = useClientAuthRedirect();

  useEffect(() => {
    if (theme) {
      const fallbackThemeColor = "#288DD1";
      const fallbackSecondaryColor = "#3272CA";

      const hexToRgba = (hex, alpha) => {
        if (!hex) return `rgba(40, 141, 209, ${alpha})`;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      const root = document.documentElement;
      root.style.setProperty(
        "--theme-color",
        theme.themeColor || fallbackThemeColor
      );
      root.style.setProperty(
        "--secondary-color",
        theme.secondaryColor || fallbackSecondaryColor
      );
      root.style.setProperty(
        "--theme-color-10",
        hexToRgba(theme.themeColor, 0.1)
      );
      root.style.setProperty(
        "--theme-color-20",
        hexToRgba(theme.themeColor, 0.2)
      );

      const favicon = document.querySelector("link[rel='icon']");
      if (favicon) favicon.href = theme.businessLogoHref;
    }
  }, [theme]);

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
