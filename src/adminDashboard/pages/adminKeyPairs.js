import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import NetworkSideMenu from "../components/infraSideMenu";
import { useFetchKeyPairs } from "../../hooks/adminHooks/keyPairHooks";
import AdminPageShell from "../components/AdminPageShell";

export default function AdminKeyPairs() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: keyPairs, isFetching: isKeyPairsFetching } = useFetchKeyPairs();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <AdminPageShell
        title="Key Pairs"
        description="Manage SSH key pairs for secure infrastructure access."
        contentClassName="flex flex-col lg:flex-row gap-6"
      >
        <NetworkSideMenu />

        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 lg:p-6">
          AdminInfra
        </div>
      </AdminPageShell>
    </>
  );
}
