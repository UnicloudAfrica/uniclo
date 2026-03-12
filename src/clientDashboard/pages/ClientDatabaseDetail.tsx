import React from "react";
import { useParams } from "react-router-dom";
import ClientPageShell from "../components/ClientPageShell";
import ManagedDatabaseDetail from "@/shared/components/databases/ManagedDatabaseDetail";

const ClientDatabaseDetail: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();

  return (
    <ClientPageShell
      title="Database Details"
      description="View and manage your managed database"
      contentClassName="space-y-6"
    >
      <ManagedDatabaseDetail
        identifier={identifier || ""}
        context="client"
        listPath="/client-dashboard/databases"
      />
    </ClientPageShell>
  );
};

export default ClientDatabaseDetail;
