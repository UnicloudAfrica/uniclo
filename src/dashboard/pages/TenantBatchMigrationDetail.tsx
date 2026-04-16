import React from "react";
import { useParams } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import BatchMigrationDetail from "@/shared/components/migrations/BatchMigrationDetail";

const TenantBatchMigrationDetail: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();

  return (
    <TenantPageShell
      title="Batch Migration"
      description="View batch migration progress and details"
      contentClassName="space-y-6"
    >
      <BatchMigrationDetail
        identifier={identifier ?? ""}
        context="tenant"
        backPath="/dashboard/batch-migrations"
      />
    </TenantPageShell>
  );
};

export default TenantBatchMigrationDetail;
