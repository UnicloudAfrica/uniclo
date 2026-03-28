import ClientPageShell from "../components/ClientPageShell";
import ServerlessDrPoliciesList from "@/shared/components/integrations/serverless-dr/ServerlessDrPoliciesList";

export default function ClientServerlessDr() {
  return (
    <ClientPageShell
      title="Serverless DR"
      description="View disaster recovery policies protecting your instances. DR VMs stay off until needed."
      contentClassName="space-y-6"
    >
      <ServerlessDrPoliciesList
        context="client"
        detailBasePath="/dashboard/serverless-dr"
      />
    </ClientPageShell>
  );
}
