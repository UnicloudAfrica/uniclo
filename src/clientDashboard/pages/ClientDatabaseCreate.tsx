import React from "react";
import ClientPageShell from "../components/ClientPageShell";
import DatabaseCreationWizard from "@/shared/components/databases/DatabaseCreationWizard";

const ClientDatabaseCreate: React.FC = () => (
  <ClientPageShell
    title="Create Lattice Database"
    description="Deploy a new Lattice managed database cluster"
    contentClassName="space-y-6"
  >
    <DatabaseCreationWizard context="client" listPath="/client-dashboard/databases" />
  </ClientPageShell>
);

export default ClientDatabaseCreate;
