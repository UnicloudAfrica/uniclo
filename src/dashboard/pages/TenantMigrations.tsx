import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import MigrationDashboard from "@/shared/components/migrations/MigrationDashboard";
import { ResilienceHero } from "@/shared/components/orbit";

const TenantMigrations: React.FC = () => (
  <TenantPageShell title="" description="" contentClassName="space-y-6">
    <ResilienceHero
      topic="migrations"
      role="tenant"
      primaryCta={{
        label: "Start a migration",
        onClick: () => (window.location.href = "/dashboard/migrations/new"),
      }}
    />
    <MigrationDashboard context="tenant" wizardPath="/dashboard/migrations/new" />
  </TenantPageShell>
);

export default TenantMigrations;
