import React, { useState } from "react";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";

const ClientCalculator = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () =>
    setIsMobileMenuOpen((previous) => !previous);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />
      <ClientPageShell
        title="Advanced Calculator"
        description="Configure your infrastructure, calculate pricing with discounts, and optionally generate invoices or leads."
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Pricing Calculator" },
        ]}
      />
    </>
  );
};

export default ClientCalculator;
