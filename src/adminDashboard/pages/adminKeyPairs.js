import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import NetworkSideMenu from "../components/infraSideMenu";
import { useFetchKeyPairs } from "../../hooks/adminHooks/keyPairHooks";

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
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex flex-col lg:flex-row">
        <NetworkSideMenu />

        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 lg:p-6 lg:w-[76%]">
          AdminInfra
        </div>
      </main>
    </>
  );
}
