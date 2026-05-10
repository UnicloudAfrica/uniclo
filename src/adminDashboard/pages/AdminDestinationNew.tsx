import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import DestinationWizard from "@/shared/components/integrations/DestinationWizard";
import { RESILIENCE } from "@/shared/branding";

/**
 * Admin variant of the "Add a destination" wizard. Replaces the old
 * CreateDestinationModal per RES-162 — the modal had 5 fields plus a
 * provider-specific config sub-form, well past the wizard threshold.
 */
export default function AdminDestinationNew() {
  const navigate = useNavigate();
  return (
    <AdminPageShell
      title={`Add a destination · ${RESILIENCE}`}
      description="Walk through four quick steps and we'll save your backup destination."
      contentClassName="py-6"
    >
      <DestinationWizard
        onSuccess={() => navigate("/admin-dashboard/destinations")}
        onCancel={() => navigate("/admin-dashboard/destinations")}
      />
    </AdminPageShell>
  );
}
