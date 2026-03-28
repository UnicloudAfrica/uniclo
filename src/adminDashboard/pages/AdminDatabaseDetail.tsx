import { useParams } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import ManagedDatabaseDetail from "@/shared/components/databases/ManagedDatabaseDetail";

export default function AdminDatabaseDetail() {
  const { identifier } = useParams<{ identifier: string }>();

  return (
    <AdminPageShell
      title="Database Details"
      description="View and manage a Lattice database"
      contentClassName="space-y-6"
    >
      <ManagedDatabaseDetail
        identifier={identifier || ""}
        context="admin"
        listPath="/admin-dashboard/databases"
      />
    </AdminPageShell>
  );
}
