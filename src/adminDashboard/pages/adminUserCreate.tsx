// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell.tsx";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import { AddAdminModal } from "./adminComps/addAdmin";
import { ModernButton } from "../../shared/components/ui";

const AdminUserCreate = () => {
  const navigate = useNavigate();

  const goBack = () => navigate("/admin-dashboard/admin-users");

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
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
