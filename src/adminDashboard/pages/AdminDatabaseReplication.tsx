import AdminPageShell from "../components/AdminPageShell";
import DatabaseReplicationWorkspace from "@/shared/components/integrations/DatabaseReplicationWorkspace";

export default function AdminDatabaseReplication() {
  return (
    <DatabaseReplicationWorkspace
      PageShell={AdminPageShell}
      title="Database Replication"
      description="Manage database-native replication for PostgreSQL, MySQL, and MongoDB workloads"
    />
  );
}
