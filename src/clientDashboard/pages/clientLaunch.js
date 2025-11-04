import React, { useState } from "react";
import ClientActiveTab from "../components/clientActiveTab";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import LaunchSideMenu from "./launchComps/launchSideMenu";
import ClientPageShell from "../components/ClientPageShell";

export default function ClientLaunch() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />
      <ClientPageShell
        title="Launch Center"
        description="Configure and orchestrate your provisioning workflow."
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Launch" },
        ]}
        contentWrapper="div"
      >
        <div className="flex w-full flex-col gap-6 lg:flex-row">
          <LaunchSideMenu />
          <div className="flex-1 rounded-lg bg-white p-4 shadow-sm lg:w-[76%] lg:p-6">
            {/* active component goes here */}
          </div>
        </div>
      </ClientPageShell>
    </>
  );
}
