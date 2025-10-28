import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import AddClientModal from "./clientComps/addClient";
import ModernButton from "../components/ModernButton";

const AdminClientCreate = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const goBack = () => navigate("/admin-dashboard/clients");

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title="Add Client"
        description="Create a new client profile and assign the appropriate tenant."
        actions={
          <ModernButton variant="outline" onClick={goBack}>
            Back to Clients
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        <TenantClientsSideMenu />
        <AddClientModal isOpen mode="page" onClose={goBack} />
      </AdminPageShell>
    </>
  );
};

export default AdminClientCreate;
