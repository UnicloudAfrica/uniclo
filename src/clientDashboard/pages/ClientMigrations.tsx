import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import MigrationDashboard from "@/shared/components/migrations/MigrationDashboard";
import { ResilienceHero } from "@/shared/components/orbit";

const ClientMigrations: React.FC = () => (
  <ClientPageShell title="" description="" contentClassName="space-y-6">
    <ResilienceHero topic="migrations" role="client" />
    <MigrationDashboard context="client" wizardPath="/client-dashboard/migrations/new" />
  </ClientPageShell>
);

export default ClientMigrations;
