import AdminPageShell from "../components/AdminPageShell";
import DatabaseCreationWizard from "@/shared/components/databases/DatabaseCreationWizard";

export default function AdminDatabaseCreate() {
  return (
    <AdminPageShell
      title="Create Lattice Database"
      description="Deploy a new Lattice managed database cluster"
      contentClassName="space-y-6"
    >
      <DatabaseCreationWizard context="admin" listPath="/admin-dashboard/databases" />
    </AdminPageShell>
  );
}
