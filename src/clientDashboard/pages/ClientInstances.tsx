import React from "react";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import SharedInstanceList from "@/shared/components/instances/SharedInstanceList";

const ClientInstances: React.FC = () => {
  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Cube Instances"
        description="Manage and monitor your cloud instances."
        contentClassName="space-y-6 lg:space-y-8"
        breadcrumbs={[{ label: "Home", href: "/client-dashboard" }, { label: "Cube Instances" }]}
      >
        <SharedInstanceList context="client" />
      </ClientPageShell>
    </>
  );
};

export default ClientInstances;
