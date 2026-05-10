import TenantPageShell from "../components/TenantPageShell";
import ServerlessDrPoliciesList from "@/shared/components/integrations/serverless-dr/ServerlessDrPoliciesList";
import { ResilienceHero } from "@/shared/components/orbit";

export default function TenantServerlessDr() {
  return (
    <TenantPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero
        topic="serverless-dr"
        role="tenant"
        primaryCta={{
          label: "Set up a policy",
          onClick: () => (window.location.href = "/dashboard/serverless-dr/new"),
        }}
      />
      <ServerlessDrPoliciesList
        context="tenant"
        detailBasePath="/dashboard/serverless-dr"
        createPath="/dashboard/serverless-dr/new"
      />
    </TenantPageShell>
  );
}
