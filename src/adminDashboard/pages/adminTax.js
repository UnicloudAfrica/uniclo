import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import { useFetchTaxConfigurations } from "../../hooks/adminHooks/taxConfigurationHooks";

export default function AdminTax() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: taxconfigurations, isFetching: isTaxFetching } =
    useFetchTaxConfigurations();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu
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
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8 flex flex-col lg:flex-row">
        Admin Tax Configuration will go here
      </main>
    </>
  );
}
