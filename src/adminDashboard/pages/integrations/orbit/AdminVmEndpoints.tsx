import AdminPageShell from "../../../components/AdminPageShell";
import VmEndpointsPage from "@/shared/components/orbit/vmEndpoints/VmEndpointsPage";
import { RESILIENCE } from "@/shared/branding";

/**
 * Admin variant of the source-VM list. Wraps the shared VmEndpointsPage
 * with admin paths and full edit permissions.
 */
export default function AdminVmEndpoints() {
  return (
    <AdminPageShell
      title={`${RESILIENCE} · Sources`}
      description="Connected source servers across all tenants. Add, scan, or remove."
      contentClassName="space-y-6"
    >
      <VmEndpointsPage
        registerPath="/admin-dashboard/integrations/orbit/vms/new"
        detailPath={(id) => `/admin-dashboard/integrations/orbit/vms/${id}`}
        canEdit={true}
      />
    </AdminPageShell>
  );
}
