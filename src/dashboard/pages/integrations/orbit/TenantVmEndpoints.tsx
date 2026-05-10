import TenantPageShell from "../../../components/TenantPageShell";
import VmEndpointsPage from "@/shared/components/orbit/vmEndpoints/VmEndpointsPage";
import { RESILIENCE } from "@/shared/branding";

/**
 * Tenant variant — full edit permissions, scoped to the tenant's own
 * source endpoints by the API layer (X-Acf-Client-Id header injected by
 * the driver based on auth context).
 */
export default function TenantVmEndpoints() {
  return (
    <TenantPageShell
      title="Your servers"
      description={`Servers you've connected to ${RESILIENCE} — add a new one to move it to the cloud.`}
      contentClassName="space-y-6"
    >
      <VmEndpointsPage
        registerPath="/dashboard/integrations/orbit/vms/new"
        detailPath={(id) => `/dashboard/integrations/orbit/vms/${id}`}
        canEdit={true}
        headline="Your servers, ready to move"
        subheadline="These are the machines you've connected. Pick one to move to the cloud — or add a new one and we'll get it ready."
      />
    </TenantPageShell>
  );
}
