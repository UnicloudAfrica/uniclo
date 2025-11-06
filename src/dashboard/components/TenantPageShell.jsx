import React, { useState } from "react";
import Headbar from "./headbar";
import Sidebar from "./sidebar";
import ActiveTab from "./activeTab";
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";
import useAuthRedirect from "../../utils/authRedirect";

const TenantPageShell = ({
  title,
  description,
  subHeaderContent,
  children,
  ...shellProps
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoading } = useAuthRedirect();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <DashboardPageShell
        homeHref="/dashboard"
        title={title}
        description={description}
        subHeaderContent={subHeaderContent}
        backgroundColor="transparent"
        {...shellProps}
      >
        {children}
      </DashboardPageShell>
    </>
  );
};

export default TenantPageShell;
