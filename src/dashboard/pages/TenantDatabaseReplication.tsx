import TenantPageShell from "../../tenantDashboard/components/TenantPageShell";
import DatabaseReplicationWorkspace from "@/shared/components/integrations/DatabaseReplicationWorkspace";
import { ResilienceHero } from "@/shared/components/orbit";
import type React from "react";

export default function TenantDatabaseReplication() {
  const HeroShell: React.ComponentType<{
    title: string;
    description?: string;
    contentClassName?: string;
    children?: React.ReactNode;
  }> = ({ children, contentClassName }) => (
    <TenantPageShell title="" description="" contentClassName={contentClassName ?? "space-y-6"}>
      <ResilienceHero topic="database-replication" role="tenant" />
      {children}
    </TenantPageShell>
  );

  return <DatabaseReplicationWorkspace PageShell={HeroShell} title="" description="" />;
}
