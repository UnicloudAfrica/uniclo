import TenantPageShell from "../../tenantDashboard/components/TenantPageShell";
import DatabaseReplicationWorkspace from "@/shared/components/integrations/DatabaseReplicationWorkspace";

export default function TenantDatabaseReplication() {
  return (
    <DatabaseReplicationWorkspace
      PageShell={TenantPageShell as never}
      title="Database Replication"
      description="Manage database-native replication for PostgreSQL, MySQL, and MongoDB workloads"
    />
  );
}
