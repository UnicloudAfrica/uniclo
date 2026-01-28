import React from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import { ModernButton } from "../../shared/components/ui";
import ClientsManagement from "../../shared/components/customer-management/ClientsManagement";

const Clients = () => {
  const navigate = useNavigate();

  const headerActions = (
    <ModernButton
      variant="primary"
      onClick={() => navigate("/dashboard/clients/new")}
      className="flex items-center gap-2"
    >
      <Plus size={18} />
      Add Client
    </ModernButton>
  );

  return (
    <TenantPageShell
      title="Clients"
      description="Manage client accounts, contacts, and workspace access."
      actions={headerActions}
      contentClassName="space-y-6"
    >
      <ClientsManagement context="tenant" />
    </TenantPageShell>
  );
};

export default Clients;
