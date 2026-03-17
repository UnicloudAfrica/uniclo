import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import MigrationWizard from "@/shared/components/migrations/MigrationWizard";

const TenantMigrationWizard: React.FC = () => (
  <TenantPageShell
    title="New Migration"
    description="Transfer data between any two servers"
    contentClassName="space-y-6"
  >
    <MigrationWizard context="tenant" listPath="/dashboard/migrations" />
  </TenantPageShell>
);

export default TenantMigrationWizard;
