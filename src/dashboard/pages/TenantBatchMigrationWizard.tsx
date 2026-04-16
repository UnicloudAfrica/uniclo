import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import BatchMigrationWizard from "@/shared/components/migrations/BatchMigrationWizard";

const TenantBatchMigrationWizard: React.FC = () => (
  <TenantPageShell
    title="New Batch Migration"
    description="Create a batch migration to move multiple VMs at once"
    contentClassName="space-y-6"
  >
    <BatchMigrationWizard
      context="tenant"
      backPath="/dashboard/batch-migrations"
    />
  </TenantPageShell>
);

export default TenantBatchMigrationWizard;
