import AdminPageShell from "../components/AdminPageShell";
import ManagedDatabaseList from "@/shared/components/databases/ManagedDatabaseList";

export default function AdminManagedDatabases() {
  return (
    <AdminPageShell
      title="Lattice Databases"
      description="Manage all tenant Lattice database clusters"
      contentClassName="space-y-6"
    >
      <ManagedDatabaseList
        context="admin"
        createPath="/admin-dashboard/databases/create"
        detailBasePath="/admin-dashboard/databases"
      />
    </AdminPageShell>
  );
}
