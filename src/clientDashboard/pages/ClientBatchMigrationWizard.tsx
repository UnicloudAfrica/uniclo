import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import BatchMigrationWizard from "@/shared/components/migrations/BatchMigrationWizard";

const ClientBatchMigrationWizard: React.FC = () => (
  <ClientPageShell
    title="New Batch Migration"
    description="Create a batch migration to move multiple VMs at once"
    contentClassName="space-y-6"
  >
    <BatchMigrationWizard
      context="client"
      backPath="/client-dashboard/batch-migrations"
    />
  </ClientPageShell>
);

export default ClientBatchMigrationWizard;
