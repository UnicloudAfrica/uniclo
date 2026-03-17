import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import MigrationDashboard from "@/shared/components/migrations/MigrationDashboard";

const ClientMigrations: React.FC = () => (
  <ClientPageShell
    title="Migration Services"
    description="Migrate data between any servers, billed through your wallet"
    contentClassName="space-y-6"
  >
    <MigrationDashboard
      context="client"
      wizardPath="/client-dashboard/migrations/new"
    />
  </ClientPageShell>
);

export default ClientMigrations;
