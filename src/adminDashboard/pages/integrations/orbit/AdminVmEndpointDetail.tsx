import { useParams } from "react-router-dom";
import AdminPageShell from "../../../components/AdminPageShell";
import VmEndpointDetailPage from "@/shared/components/orbit/vmEndpoints/VmEndpointDetailPage";

export default function AdminVmEndpointDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <AdminPageShell title="Server detail" description="" contentClassName="py-6">
      <VmEndpointDetailPage
        identifier={id ?? ""}
        backPath="/admin-dashboard/integrations/orbit/vms"
        afterDeletePath="/admin-dashboard/integrations/orbit/vms"
        canEdit={true}
      />
    </AdminPageShell>
  );
}
