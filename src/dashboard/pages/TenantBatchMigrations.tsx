import React from "react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import BatchMigrationDashboard from "@/shared/components/migrations/BatchMigrationDashboard";
import { ResilienceHero } from "@/shared/components/orbit";

const TenantBatchMigrations: React.FC = () => {
  const navigate = useNavigate();
  return (
    <TenantPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero
        topic="batch-migrations"
        role="tenant"
        primaryCta={{
          label: "New batch",
          onClick: () => navigate("/dashboard/batch-migrations/new"),
        }}
      />
      <BatchMigrationDashboard context="tenant" wizardPath="/dashboard/batch-migrations/new" />
    </TenantPageShell>
  );
};

export default TenantBatchMigrations;
