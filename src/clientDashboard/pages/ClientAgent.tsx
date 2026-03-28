import ClientPageShell from "../components/ClientPageShell";
import AgentDashboard from "@/shared/components/integrations/agent/AgentDashboard";

export default function ClientAgent() {
  return (
    <ClientPageShell
      title="Infrastructure Agent"
      description="View automated monitoring rules and pending decisions for your infrastructure."
      contentClassName="space-y-6"
    >
      <AgentDashboard context="client" />
    </ClientPageShell>
  );
}
