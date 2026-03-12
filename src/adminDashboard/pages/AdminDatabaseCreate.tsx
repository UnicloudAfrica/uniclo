import AdminPageShell from "../components/AdminPageShell";
import DatabaseCreationWizard from "@/shared/components/databases/DatabaseCreationWizard";

export default function AdminDatabaseCreate() {
  return (
    <AdminPageShell
      title="Create Database"
      description="Deploy a new managed database cluster"
      contentClassName="space-y-6"
    >
      <DatabaseCreationWizard context="admin" listPath="/admin/databases" />
    </AdminPageShell>
  );
}
