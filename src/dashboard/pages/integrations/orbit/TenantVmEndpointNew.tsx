import { useNavigate } from "react-router-dom";
import TenantPageShell from "../../../components/TenantPageShell";
import VmEndpointWizard from "@/shared/components/orbit/vmEndpoints/VmEndpointWizard";

/** Tenant variant of "Add a server". */
export default function TenantVmEndpointNew() {
  const navigate = useNavigate();

  return (
    <TenantPageShell
      title="Connect a server"
      description="Walk through five quick steps to add a new server."
      contentClassName="py-6"
    >
      <VmEndpointWizard
        onSuccess={(id) => navigate(`/dashboard/integrations/orbit/vms/${id}`)}
        onCancel={() => navigate("/dashboard/integrations/orbit/vms")}
      />
    </TenantPageShell>
  );
}
