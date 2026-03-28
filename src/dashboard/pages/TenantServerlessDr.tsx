import TenantPageShell from "../components/TenantPageShell";
import ServerlessDrPoliciesList from "@/shared/components/integrations/serverless-dr/ServerlessDrPoliciesList";

export default function TenantServerlessDr() {
  return (
    <TenantPageShell
      title="Serverless DR"
      description="Manage your serverless disaster recovery policies. DR VMs stay off until needed — pay only for storage."
      contentClassName="space-y-6"
    >
      <ServerlessDrPoliciesList
        context="tenant"
        detailBasePath="/tenant-dashboard/serverless-dr"
        createPath="/tenant-dashboard/serverless-dr/new"
      />
    </TenantPageShell>
  );
}
