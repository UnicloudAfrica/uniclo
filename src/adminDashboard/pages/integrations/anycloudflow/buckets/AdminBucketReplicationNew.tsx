import { useNavigate } from "react-router-dom";
import AdminPageShell from "../../../../components/AdminPageShell";
import BucketReplicationWizard from "@/shared/components/bucket-replication/BucketReplicationWizard";
import { RESILIENCE } from "@/shared/branding";

/**
 * Admin variant of the "Mirror a bucket" wizard. Lives at a real URL so
 * users can browser-back / bookmark / refresh — unlike the old modal.
 */
export default function AdminBucketReplicationNew() {
  const navigate = useNavigate();
  return (
    <AdminPageShell
      title={`Mirror a bucket · ${RESILIENCE}`}
      description="Walk through four quick steps and we'll set up continuous bucket mirroring."
      contentClassName="py-6"
    >
      <BucketReplicationWizard
        onSuccess={(id) =>
          navigate(`/admin-dashboard/integrations/orbit/buckets/replications/${id}`)
        }
        onCancel={() => navigate("/admin-dashboard/integrations/orbit/buckets/replications")}
      />
    </AdminPageShell>
  );
}
