import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import DestinationWizard from "@/shared/components/integrations/DestinationWizard";

/**
 * Tenant variant of the "Add a destination" wizard. Replaces the old
 * CreateDestinationModal per RES-162.
 */
export default function TenantDestinationNew() {
  const navigate = useNavigate();
  return (
    <TenantPageShell
      title="Add a destination"
      description="Walk through four quick steps and we'll save your backup destination."
      contentClassName="py-6"
    >
      <DestinationWizard
        onSuccess={() => navigate("/dashboard/destinations")}
        onCancel={() => navigate("/dashboard/destinations")}
      />
    </TenantPageShell>
  );
}
