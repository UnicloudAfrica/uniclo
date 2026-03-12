import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import ManagedDatabaseList from "@/shared/components/databases/ManagedDatabaseList";

const ClientManagedDatabases: React.FC = () => (
  <ClientPageShell
    title="Managed Databases"
    description="Deploy and manage fully managed database clusters"
    contentClassName="space-y-6"
  >
    <ManagedDatabaseList
      context="client"
      createPath="/client-dashboard/databases/create"
      detailBasePath="/client-dashboard/databases"
    />
  </ClientPageShell>
);

export default ClientManagedDatabases;
