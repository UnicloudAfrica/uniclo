import AdminPageShell from "../components/AdminPageShell";
import ServerlessDrPoliciesList from "@/shared/components/integrations/serverless-dr/ServerlessDrPoliciesList";

export default function AdminServerlessDr() {
  return (
    <AdminPageShell
      title="Serverless DR"
      description="Manage serverless disaster recovery policies across all tenants. DR VMs stay off until needed — pay only for storage."
      contentClassName="space-y-6"
    >
      <ServerlessDrPoliciesList
        context="admin"
        detailBasePath="/admin-dashboard/serverless-dr"
      />
    </AdminPageShell>
  );
}
