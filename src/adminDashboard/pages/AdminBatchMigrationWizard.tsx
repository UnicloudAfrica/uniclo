import AdminPageShell from "../components/AdminPageShell";
import BatchMigrationWizard from "@/shared/components/migrations/BatchMigrationWizard";

export default function AdminBatchMigrationWizard() {
  return (
    <AdminPageShell
      title="New Batch Migration"
      description="Create a batch migration to move multiple VMs at once"
      contentClassName="space-y-6"
    >
      <BatchMigrationWizard
        context="admin"
        backPath="/admin-dashboard/batch-migrations"
      />
    </AdminPageShell>
  );
}
