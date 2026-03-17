import AdminPageShell from "../components/AdminPageShell";
import MigrationWizard from "@/shared/components/migrations/MigrationWizard";

export default function AdminMigrationWizard() {
  return (
    <AdminPageShell
      title="New Migration"
      description="Transfer data between any two servers"
      contentClassName="space-y-6"
    >
      <MigrationWizard
        context="admin"
        listPath="/admin-dashboard/migrations"
      />
    </AdminPageShell>
  );
}
