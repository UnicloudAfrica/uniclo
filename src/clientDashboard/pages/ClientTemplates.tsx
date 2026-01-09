// @ts-nocheck
import React, { useState } from "react";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import TemplateManager from "../../shared/components/templates/TemplateManager";

const ClientTemplates: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      <ClientActiveTab />
      <ClientPageShell
        title="Instance Templates"
        description="Create, edit, and manage reusable instance templates."
        contentClassName="space-y-6"
        breadcrumbs={[{ label: "Home", href: "/client-dashboard" }, { label: "Templates" }]}
      >
        <TemplateManager />
      </ClientPageShell>
    </>
  );
};

export default ClientTemplates;
