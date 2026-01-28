// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import ClientCreateForm from "../../shared/components/customer-management/ClientCreateForm";
import { ModernButton } from "../../shared/components/ui";

const AdminClientCreate = () => {
  const navigate = useNavigate();

  const goBack = () => navigate("/admin-dashboard/clients");

  return (
    <>
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
        <ClientCreateForm context="admin" mode="page" onClose={goBack} />
      </AdminPageShell>
    </>
  );
};

export default AdminClientCreate;
