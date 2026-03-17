import React from "react";
import TenantPageShell from "../components/TenantPageShell";
import DestinationsList from "@/shared/components/integrations/DestinationsList";

const TenantDestinations: React.FC = () => (
  <TenantPageShell
    title="Backup Destinations"
    description="Configure storage destinations for backup and replication"
    contentClassName="space-y-6"
  >
    <DestinationsList />
  </TenantPageShell>
);

export default TenantDestinations;
