import AdminPageShell from "../components/AdminPageShell";
import DestinationsList from "@/shared/components/integrations/DestinationsList";

export default function AdminDestinations() {
  return (
    <AdminPageShell
      title="Backup Destinations"
      description="Configure storage destinations for backup, replication, and DR across all tenants"
      contentClassName="space-y-6"
    >
      <DestinationsList />
    </AdminPageShell>
  );
}
