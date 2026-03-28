import TenantPageShell from "../components/TenantPageShell";
import AgentDashboard from "@/shared/components/integrations/agent/AgentDashboard";

export default function TenantAgent() {
  return (
    <TenantPageShell
      title="Infrastructure Agent"
      description="Automated monitoring rules and approval-based actions for replication, backup, and DR."
      contentClassName="space-y-6"
    >
      <AgentDashboard context="tenant" />
    </TenantPageShell>
  );
}
