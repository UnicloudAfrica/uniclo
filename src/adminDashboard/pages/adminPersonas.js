import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import AdminPageShell from "../components/AdminPageShell";

export default function AdminPersonas() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        title="Product Personas"
        description="Define customer personas to tailor module bundles and pricing."
        contentClassName="flex flex-col lg:flex-row gap-6"
      >
        <ProductSideMenu />

        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 lg:p-6"></div>
      </AdminPageShell>
    </>
  );
}
