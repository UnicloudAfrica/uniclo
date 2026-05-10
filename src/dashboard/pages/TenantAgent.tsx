import TenantPageShell from "../components/TenantPageShell";
import AgentDashboard from "@/shared/components/integrations/agent/AgentDashboard";
import { RESILIENCE } from "@/shared/branding";

export default function TenantAgent() {
  return (
    <TenantPageShell
      title={`${RESILIENCE} Automation`}
      description="Rules and approval-based decisions that automate replication, backup, retention, scaling, and DR drills."
      contentClassName="space-y-6"
    >
      <AgentDashboard context="tenant" />
    </TenantPageShell>
  );
}
