import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import TenantHeadbar from "../../tenantDashboard/components/TenantHeadbar";
import TenantSidebar from "../../tenantDashboard/components/TenantSidebar";
import ActiveTab from "./activeTab";
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";
import useAuthRedirect from "../../utils/authRedirect";
import { useTenantBrandingTheme } from "../../hooks/useBrandingTheme";

interface TenantPageShellProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  subHeaderContent?: React.ReactNode;
  children?: React.ReactNode;
  [key: string]: any;
}

const TenantPageShell: React.FC<TenantPageShellProps> = ({
  title,
  description,
  subHeaderContent,
  children,
  ...shellProps
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const { isLoading } = useAuthRedirect();
  const { data: theme } = useTenantBrandingTheme();

  const tenantData = {
    name: theme?.company?.name || "Tenant",
    logo: theme?.logo || "",
    color: theme?.accentColor || "#1C1C1C",
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#288DD1]" />
      </div>
    );
  }

  return (
    <>
      <TenantHeadbar tenantData={tenantData} onMenuClick={toggleMobileMenu} />
      <TenantSidebar tenantData={tenantData} activeTab={activeTab} setActiveTab={setActiveTab} />
      <ActiveTab />
      <DashboardPageShell
        homeHref="/dashboard"
        title={title}
        description={description}
        subHeaderContent={subHeaderContent}
        backgroundColor="#F9FAFB"
        {...shellProps}
      >
        {children}
      </DashboardPageShell>
    </>
  );
};

export default TenantPageShell;
