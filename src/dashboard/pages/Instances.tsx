import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import SharedInstanceList from "../../shared/components/instances/SharedInstanceList";

const Instances: React.FC = () => {
  return (
    <TenantPageShell
      title="Instances"
      description="Manage and monitor your compute instances"
      contentClassName="space-y-6 lg:space-y-8"
    >
      <SharedInstanceList context="tenant" />
    </TenantPageShell>
  );
};

export default Instances;
