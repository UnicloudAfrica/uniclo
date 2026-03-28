import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import ManagedDatabaseList from "@/shared/components/databases/ManagedDatabaseList";

const TenantManagedDatabases: React.FC = () => (
  <TenantPageShell
    title="Lattice Databases"
    description="Deploy and manage fully managed Lattice database clusters"
    contentClassName="space-y-6"
  >
    <ManagedDatabaseList
      context="tenant"
      createPath="/dashboard/databases/create"
      detailBasePath="/dashboard/databases"
    />
  </TenantPageShell>
);

export default TenantManagedDatabases;
