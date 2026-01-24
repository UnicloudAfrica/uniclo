import React, { useState } from "react";
import Sidebar from "./TenantSidebar";
import HeaderBar from "./TenantHeadbar";
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";
import { useTenantBrandingTheme } from "../../hooks/useBrandingTheme";

const TenantClientPageShell = ({
  title,
  description,
  children,
  className = "",
  contentClassName = "space-y-6",
  ...rest
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const { data: theme } = useTenantBrandingTheme();

  const tenantData = {
    name: theme?.company?.name || "Tenant",
    logo: theme?.logo || "",
    color: theme?.accentColor || "#1C1C1C",
  };

  return (
    <>
      <HeaderBar onMenuClick={toggleMobileMenu} tenantData={tenantData} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
        tenantData={tenantData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <DashboardPageShell
        title={title}
        description={description}
        homeHref="/dashboard"
        mainClassName={["tenant-dashboard-shell", className].filter(Boolean).join(" ").trim()}
        contentClassName={contentClassName}
        backgroundColor="#F9FAFB"
        {...rest}
      >
        {children}
      </DashboardPageShell>
    </>
  );
};

export default TenantClientPageShell;
