import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import DatabaseCreationWizard from "@/shared/components/databases/DatabaseCreationWizard";

const TenantDatabaseCreate: React.FC = () => (
  <TenantPageShell
    title="Create Database"
    description="Deploy a new managed database cluster"
    contentClassName="space-y-6"
  >
    <DatabaseCreationWizard context="tenant" listPath="/dashboard/databases" />
  </TenantPageShell>
);

export default TenantDatabaseCreate;
