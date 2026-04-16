import React from "react";
import { useParams } from "react-router-dom";
import ClientPageShell from "../components/ClientPageShell";
import BatchMigrationDetail from "@/shared/components/migrations/BatchMigrationDetail";

const ClientBatchMigrationDetail: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();

  return (
    <ClientPageShell
      title="Batch Migration"
      description="View batch migration progress and details"
      contentClassName="space-y-6"
    >
      <BatchMigrationDetail
        identifier={identifier ?? ""}
        context="client"
        backPath="/client-dashboard/batch-migrations"
      />
    </ClientPageShell>
  );
};

export default ClientBatchMigrationDetail;
