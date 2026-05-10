import ClientPageShell from "../../../components/ClientPageShell";
import VmEndpointsPage from "@/shared/components/orbit/vmEndpoints/VmEndpointsPage";

/**
 * Client variant — read-only. Clients can view sources their tenant has
 * registered for them but cannot add, edit, or delete. The API enforces
 * this independently; the page passes canEdit=false for the UI affordance.
 */
export default function ClientVmEndpoints() {
  return (
    <ClientPageShell
      title="Your servers"
      description="Servers your provider has connected for you. Click a server to see its readiness report."
      contentClassName="space-y-6"
    >
      <VmEndpointsPage
        registerPath="" // unused when canEdit=false
        detailPath={(id) => `/client-dashboard/integrations/orbit/vms/${id}`}
        canEdit={false}
        headline="Your servers"
        subheadline="Here are the machines your provider has connected. Tap any of them to see if they're ready to move and what we found."
      />
    </ClientPageShell>
  );
}
