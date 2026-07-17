import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import ServerlessDrPoliciesList from "@/shared/components/integrations/serverless-dr/ServerlessDrPoliciesList";
import { ResilienceHero } from "@/shared/components/orbit";

export default function TenantServerlessDr() {
  const navigate = useNavigate();
  return (
    <TenantPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero
        topic="serverless-dr"
        role="tenant"
        primaryCta={{
          label: "Set up a policy",
          onClick: () => navigate("/dashboard/serverless-dr/new"),
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
