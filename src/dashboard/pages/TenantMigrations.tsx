import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import MigrationDashboard from "@/shared/components/migrations/MigrationDashboard";

const TenantMigrations: React.FC = () => (
  <TenantPageShell
    title="Migration Services"
    description="Manage migrations across all clients"
    contentClassName="space-y-6"
  >
    <MigrationDashboard
      context="tenant"
      wizardPath="/dashboard/migrations/new"
    />
  </TenantPageShell>
);

export default TenantMigrations;
