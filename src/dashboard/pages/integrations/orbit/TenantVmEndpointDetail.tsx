import { useParams } from "react-router-dom";
import TenantPageShell from "../../../components/TenantPageShell";
import VmEndpointDetailPage from "@/shared/components/orbit/vmEndpoints/VmEndpointDetailPage";

export default function TenantVmEndpointDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <TenantPageShell title="Server detail" description="" contentClassName="py-6">
      <VmEndpointDetailPage
        identifier={id ?? ""}
        backPath="/dashboard/integrations/orbit/vms"
        afterDeletePath="/dashboard/integrations/orbit/vms"
        canEdit={true}
      />
    </TenantPageShell>
  );
}
