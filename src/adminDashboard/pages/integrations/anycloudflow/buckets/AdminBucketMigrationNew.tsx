import { useNavigate } from "react-router-dom";
import AdminPageShell from "../../../../components/AdminPageShell";
import BucketMigrationWizard from "@/shared/components/bucket-replication/BucketMigrationWizard";
import { RESILIENCE } from "@/shared/branding";

/**
 * Admin variant of the "Move a bucket" wizard. Replaces the old
 * inline `CreateMigrationModal` that lived inside BucketMigrationsPage
 * — the modal flunked the wizard rule (4 fields + dependent
 * validation + destructive live-migration branch). This page is
 * deep-linkable, browser-back-friendly, and shareable.
 */
export default function AdminBucketMigrationNew() {
  const navigate = useNavigate();
  return (
    <AdminPageShell
      title={`Move a bucket · ${RESILIENCE}`}
      description="Walk through four quick steps and we'll start the move (or a dry-run estimate first)."
      contentClassName="py-6"
    >
      <BucketMigrationWizard
        onSuccess={(id) =>
          navigate(`/admin-dashboard/integrations/orbit/buckets/migrations/${id}`)
        }
        onCancel={() => navigate("/admin-dashboard/integrations/orbit/buckets/migrations")}
      />
    </AdminPageShell>
  );
}
