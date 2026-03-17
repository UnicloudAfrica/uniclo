import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import MigrationWizard from "@/shared/components/migrations/MigrationWizard";

const ClientMigrationWizard: React.FC = () => (
  <ClientPageShell
    title="New Migration"
    description="Transfer data between any two servers"
    contentClassName="space-y-6"
  >
    <MigrationWizard
      context="client"
      listPath="/client-dashboard/migrations"
    />
  </ClientPageShell>
);

export default ClientMigrationWizard;
