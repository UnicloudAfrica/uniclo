import ClientPageShell from "../components/ClientPageShell";
import DatabaseReplicationWorkspace from "@/shared/components/integrations/DatabaseReplicationWorkspace";
import { ResilienceHero } from "@/shared/components/orbit";
import type React from "react";

export default function ClientDatabaseReplication() {
  const HeroShell: React.ComponentType<{
    title: string;
    description?: string;
    contentClassName?: string;
    children?: React.ReactNode;
  }> = ({ children, contentClassName }) => (
    <ClientPageShell title="" description="" contentClassName={contentClassName ?? "space-y-6"}>
      <ResilienceHero topic="database-replication" role="client" />
      {children}
    </ClientPageShell>
  );

  return <DatabaseReplicationWorkspace PageShell={HeroShell} title="" description="" />;
}
