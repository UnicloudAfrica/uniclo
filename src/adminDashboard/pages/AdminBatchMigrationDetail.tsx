import { useParams } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import BatchMigrationDetail from "@/shared/components/migrations/BatchMigrationDetail";

export default function AdminBatchMigrationDetail() {
  const { identifier } = useParams<{ identifier: string }>();

  return (
    <AdminPageShell
      title="Batch Migration"
      description="View batch migration progress and details"
      contentClassName="space-y-6"
    >
      <BatchMigrationDetail
        identifier={identifier ?? ""}
        context="admin"
        backPath="/admin-dashboard/batch-migrations"
      />
    </AdminPageShell>
  );
}
