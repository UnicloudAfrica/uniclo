import React, { useState } from "react";
import Sidebar from "./TenantSidebar";
import HeaderBar from "./TenantHeadbar";
import BreadcrumbNav from "./clientAciveTab";
import { useTenantBrandingTheme } from "../../hooks/useBrandingTheme";

const TenantClientPageShell = ({
  title,
  description,
  children,
  className = "",
  contentClassName = "",
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
      <div className="flex flex-col min-h-screen transition-all duration-300 md:pl-20 lg:pl-[20%] pt-[74px] relative z-0">
        <header className="bg-white border-b border-gray-200 px-6 py-6 md:px-8 space-y-4">
          <BreadcrumbNav />
          <div className="flex flex-col gap-1">
            {title ? <h1 className="text-2xl font-bold text-gray-900">{title}</h1> : null}
            {description ? (
              typeof description === "string" ? (
                <p className="text-sm text-gray-500">{description}</p>
              ) : (
                description
              )
            ) : null}
          </div>
        </header>
        <main
          className={["dashboard-content-shell p-6 md:p-8 space-y-6 flex-1 bg-gray-50", className]
            .filter(Boolean)
            .join(" ")
            .trim()}
        >
          {children}
        </main>
      </div>
    </>
  );
};

export default TenantClientPageShell;
