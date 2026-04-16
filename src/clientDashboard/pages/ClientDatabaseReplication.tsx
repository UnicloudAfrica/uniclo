import ClientPageShell from "../components/ClientPageShell";
import DatabaseReplicationWorkspace from "@/shared/components/integrations/DatabaseReplicationWorkspace";

export default function ClientDatabaseReplication() {
  return (
    <DatabaseReplicationWorkspace
      PageShell={ClientPageShell}
      title="Database Replication"
      description="Manage database-native replication groups for the databases attached to your resources"
    />
  );
}
