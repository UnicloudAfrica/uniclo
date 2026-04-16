import AdminPageShell from "../components/AdminPageShell";
import BatchMigrationDashboard from "@/shared/components/migrations/BatchMigrationDashboard";

export default function AdminBatchMigrations() {
  return (
    <AdminPageShell
      title="Batch Migrations"
      description="Create and manage batch migrations across multiple VMs"
      contentClassName="space-y-6"
    >
      <BatchMigrationDashboard
        context="admin"
        wizardPath="/admin-dashboard/batch-migrations/new"
      />
    </AdminPageShell>
  );
}
