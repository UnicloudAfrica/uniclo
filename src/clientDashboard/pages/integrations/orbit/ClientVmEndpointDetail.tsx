import { useParams } from "react-router-dom";
import ClientPageShell from "../../../components/ClientPageShell";
import VmEndpointDetailPage from "@/shared/components/orbit/vmEndpoints/VmEndpointDetailPage";

export default function ClientVmEndpointDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <ClientPageShell title="Server detail" description="" contentClassName="py-6">
      <VmEndpointDetailPage
        identifier={id ?? ""}
        backPath="/client-dashboard/integrations/orbit/vms"
        afterDeletePath="/client-dashboard/integrations/orbit/vms"
        canEdit={false}
      />
    </ClientPageShell>
  );
}
