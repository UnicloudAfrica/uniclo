import AdminPageShell from "../components/AdminPageShell";
import MigrationDashboard from "@/shared/components/migrations/MigrationDashboard";

export default function AdminMigrations() {
  return (
    <AdminPageShell
      title="Migration Services"
      description="Monitor and manage migrations across all tenants"
      contentClassName="space-y-6"
    >
      <MigrationDashboard
        context="admin"
        wizardPath="/admin-dashboard/migrations/new"
      />
    </AdminPageShell>
  );
}
