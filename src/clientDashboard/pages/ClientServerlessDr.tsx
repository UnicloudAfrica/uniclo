import ClientPageShell from "../components/ClientPageShell";
import ServerlessDrPoliciesList from "@/shared/components/integrations/serverless-dr/ServerlessDrPoliciesList";
import { ResilienceHero } from "@/shared/components/orbit";

export default function ClientServerlessDr() {
  return (
    <ClientPageShell title="" description="" contentClassName="space-y-6">
      <ResilienceHero topic="serverless-dr" role="client" />
      <ServerlessDrPoliciesList
        context="client"
        detailBasePath="/client-dashboard/serverless-dr"
      />
    </ClientPageShell>
  );
}
