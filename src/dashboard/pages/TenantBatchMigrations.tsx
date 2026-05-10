import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import BatchMigrationDashboard from "@/shared/components/migrations/BatchMigrationDashboard";
import { ResilienceHero } from "@/shared/components/orbit";

const TenantBatchMigrations: React.FC = () => (
  <TenantPageShell title="" description="" contentClassName="space-y-6">
    <ResilienceHero
      topic="batch-migrations"
      role="tenant"
      primaryCta={{
        label: "New batch",
        onClick: () => (window.location.href = "/dashboard/batch-migrations/new"),
      }}
    />
    <BatchMigrationDashboard context="tenant" wizardPath="/dashboard/batch-migrations/new" />
  </TenantPageShell>
);

export default TenantBatchMigrations;
