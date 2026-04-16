import AdminPageShell from "../components/AdminPageShell";
import FlowDashboard from "@/shared/components/flow/FlowDashboard";

/**
 * Admin can also use the shared Flow dashboard to operate on behalf of a tenant.
 * They set X-Acting-Tenant-Id header (handled by useApiContext).
 */
export default function AdminFlowDashboard() {
  return (
    <AdminPageShell
      title="UniCloudFlow Dashboard"
      description="Operate UniCloudFlow on behalf of a tenant."
    >
      <FlowDashboard basePath="/admin-dashboard/flow-dashboard" />
    </AdminPageShell>
  );
}
