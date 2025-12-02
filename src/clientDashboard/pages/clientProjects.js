import React, { useState } from "react";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import DashboardPageShell from "../../shared/layouts/DashboardPageShell";

const ClientProjects = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      <ClientActiveTab />
      <DashboardPageShell
        title="Projects"
        description="Project management page"
        homeHref="/client-dashboard"
        mainClassName="client-dashboard-shell"
      >
        {/* Empty page - content removed */}
      </DashboardPageShell>
    </>
  );
};

export default ClientProjects;
