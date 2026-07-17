import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import BatchMigrationDashboard from "@/shared/components/migrations/BatchMigrationDashboard";
import { ResilienceHero } from "@/shared/components/orbit";

export default function AdminBatchMigrations() {
  const navigate = useNavigate();
  return (
    <AdminPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero
        topic="batch-migrations"
        role="admin"
        primaryCta={{
          label: "New batch",
          onClick: () => navigate("/admin-dashboard/batch-migrations/new"),
        }}
      />
      <BatchMigrationDashboard
        context="admin"
        wizardPath="/admin-dashboard/batch-migrations/new"
      />
    </AdminPageShell>
  );
}
