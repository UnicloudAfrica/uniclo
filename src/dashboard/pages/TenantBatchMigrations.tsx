import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import BatchMigrationDashboard from "@/shared/components/migrations/BatchMigrationDashboard";

const TenantBatchMigrations: React.FC = () => (
  <TenantPageShell
    title="Batch Migrations"
    description="Create and manage batch migrations across multiple VMs"
    contentClassName="space-y-6"
  >
    <BatchMigrationDashboard
      context="tenant"
      wizardPath="/dashboard/batch-migrations/new"
    />
  </TenantPageShell>
);

export default TenantBatchMigrations;
