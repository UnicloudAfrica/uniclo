import { useNavigate } from "react-router-dom";
import AdminPageShell from "../../../components/AdminPageShell";
import VmEndpointWizard from "@/shared/components/orbit/vmEndpoints/VmEndpointWizard";
import { RESILIENCE } from "@/shared/branding";

/** Admin variant of "Add a server". */
export default function AdminVmEndpointNew() {
  const navigate = useNavigate();

  return (
    <AdminPageShell
      title={`Connect a server to ${RESILIENCE}`}
      description="Walk through five quick steps and we'll add this server to your fleet."
      contentClassName="py-6"
    >
      <VmEndpointWizard
        onSuccess={(id) => navigate(`/admin-dashboard/integrations/orbit/vms/${id}`)}
        onCancel={() => navigate("/admin-dashboard/integrations/orbit/vms")}
      />
    </AdminPageShell>
  );
}
