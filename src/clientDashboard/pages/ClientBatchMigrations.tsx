import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import BatchMigrationDashboard from "@/shared/components/migrations/BatchMigrationDashboard";
import { ResilienceHero } from "@/shared/components/orbit";

const ClientBatchMigrations: React.FC = () => (
  <ClientPageShell title="" description="" contentClassName="space-y-6">
    <ResilienceHero topic="batch-migrations" role="client" />
    <BatchMigrationDashboard context="client" wizardPath="/client-dashboard/batch-migrations/new" />
  </ClientPageShell>
);

export default ClientBatchMigrations;
