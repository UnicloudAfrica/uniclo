// @ts-nocheck
import React, { useState } from "react";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";

const ClientSupport: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((previous) => !previous);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      <ClientActiveTab />
      <ClientPageShell
        title="Support"
        description="Get help from our support team whenever you need it."
        breadcrumbs={[{ label: "Home", href: "/client-dashboard" }, { label: "Support" }]}
      />
    </>
  );
};

export default ClientSupport;
