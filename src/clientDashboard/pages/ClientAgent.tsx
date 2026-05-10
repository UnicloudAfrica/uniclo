import ClientPageShell from "../components/ClientPageShell";
import AgentDashboard from "@/shared/components/integrations/agent/AgentDashboard";
import { RESILIENCE } from "@/shared/branding";

export default function ClientAgent() {
  return (
    <ClientPageShell
      title={`${RESILIENCE} Automation`}
      description="View automation rules and pending decisions for your infrastructure."
      contentClassName="space-y-6"
    >
      <AgentDashboard context="client" />
    </ClientPageShell>
  );
}
