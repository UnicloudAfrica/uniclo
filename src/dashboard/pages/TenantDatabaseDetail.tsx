import React from "react";
import { useParams } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import ManagedDatabaseDetail from "@/shared/components/databases/ManagedDatabaseDetail";

const TenantDatabaseDetail: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();

  return (
    <TenantPageShell
      title="Database Details"
      description="View and manage your managed database"
      contentClassName="space-y-6"
    >
      <ManagedDatabaseDetail
        identifier={identifier || ""}
        context="tenant"
        listPath="/dashboard/databases"
      />
    </TenantPageShell>
  );
};

export default TenantDatabaseDetail;
