import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import AddPartner from "../components/partnersComponent/addPartner";
import ModernButton from "../components/ModernButton";

const AdminPartnerCreate = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const goBack = () => navigate("/admin-dashboard/partners");

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title="Add Partner"
        description="Capture partner business information and onboarding documents."
        actions={
          <ModernButton variant="outline" onClick={goBack}>
            Back to Partners
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        <TenantClientsSideMenu />
        <AddPartner isOpen mode="page" onClose={goBack} />
      </AdminPageShell>
    </>
  );
};

export default AdminPartnerCreate;
