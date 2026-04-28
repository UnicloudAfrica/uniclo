import AdminPageShell from "../components/AdminPageShell";
import DatabaseReplicationWorkspace from "@/shared/components/integrations/DatabaseReplicationWorkspace";
import type React from "react";

export default function AdminDatabaseReplication() {
  return (
    <DatabaseReplicationWorkspace
      PageShell={AdminPageShell as React.ComponentType<{ title: string; description?: string; contentClassName?: string; children?: React.ReactNode }>}
      title="Database Replication"
      description="Manage database-native replication for PostgreSQL, MySQL, and MongoDB workloads"
    />
  );
}
