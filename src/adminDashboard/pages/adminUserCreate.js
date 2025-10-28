import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import { AddAdminModal } from "./adminComps/addAdmin";
import ModernButton from "../components/ModernButton";

const AdminUserCreate = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const goBack = () => navigate("/admin-dashboard/admin-users");

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title="Add Admin User"
        description="Provision a new administrator and grant access to the platform."
        actions={
          <ModernButton variant="outline" onClick={goBack}>
            Back to Admin Users
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        <TenantClientsSideMenu />
        <AddAdminModal isOpen mode="page" onClose={goBack} />
      </AdminPageShell>
    </>
  );
};

export default AdminUserCreate;
