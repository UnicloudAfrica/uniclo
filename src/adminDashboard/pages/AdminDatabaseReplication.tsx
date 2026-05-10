import AdminPageShell from "../components/AdminPageShell";
import DatabaseReplicationWorkspace from "@/shared/components/integrations/DatabaseReplicationWorkspace";
import { ResilienceHero } from "@/shared/components/orbit";
import type React from "react";

export default function AdminDatabaseReplication() {
  const HeroShell: React.ComponentType<{
    title: string;
    description?: string;
    contentClassName?: string;
    children?: React.ReactNode;
  }> = ({ children, contentClassName }) => (
    <AdminPageShell title="" description="" contentClassName={contentClassName ?? "space-y-6"}>
      <ResilienceHero topic="database-replication" role="admin" />
      {children}
    </AdminPageShell>
  );

  return (
    <DatabaseReplicationWorkspace
      PageShell={HeroShell}
      title=""
      description=""
    />
  );
}
