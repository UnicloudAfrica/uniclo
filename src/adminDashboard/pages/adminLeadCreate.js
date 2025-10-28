import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernButton from "../components/ModernButton";
import CreateLead from "./leadComps/createLead";

const AdminLeadCreate = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const goBack = () => navigate("/admin-dashboard/leads");

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title="Create Lead"
        description="Qualify and onboard a new lead into the revenue pipeline."
        actions={
          <ModernButton variant="outline" onClick={goBack}>
            Back to Leads
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        <CreateLead mode="page" onClose={goBack} />
      </AdminPageShell>
    </>
  );
};

export default AdminLeadCreate;
