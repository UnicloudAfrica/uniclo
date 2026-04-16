import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import BatchMigrationDashboard from "@/shared/components/migrations/BatchMigrationDashboard";

const ClientBatchMigrations: React.FC = () => (
  <ClientPageShell
    title="Batch Migrations"
    description="Create and manage batch migrations across multiple VMs"
    contentClassName="space-y-6"
  >
    <BatchMigrationDashboard
      context="client"
      wizardPath="/client-dashboard/batch-migrations/new"
    />
  </ClientPageShell>
);

export default ClientBatchMigrations;
