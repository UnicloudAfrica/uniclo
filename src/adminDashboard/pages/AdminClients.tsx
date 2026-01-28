// @ts-nocheck
import React from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import { ModernButton } from "../../shared/components/ui";
import ClientsManagement from "../../shared/components/customer-management/ClientsManagement";

const AdminClients = () => {
  const navigate = useNavigate();

  const headerActions = (
    <ModernButton
      variant="primary"
      onClick={() => navigate("/admin-dashboard/clients/create")}
      className="flex items-center gap-2"
    >
      <Plus size={18} />
      Add Client
    </ModernButton>
  );

  return (
    <AdminPageShell
      title="Clients Management"
      description="Manage client accounts, tenant assignments, and contacts."
      actions={headerActions}
      contentClassName="space-y-6"
    >
      <TenantClientsSideMenu />
      <ClientsManagement context="admin" />
    </AdminPageShell>
  );
};

export default AdminClients;
