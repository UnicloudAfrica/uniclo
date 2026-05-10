import AdminPageShell from "../components/AdminPageShell";
import AgentDashboard from "@/shared/components/integrations/agent/AgentDashboard";
import { RESILIENCE } from "@/shared/branding";

export default function AdminAgent() {
  return (
    <AdminPageShell
      title={`${RESILIENCE} Automation`}
      description="Rules and approval-based decisions that automate replication, backup, retention, scaling, and DR drills."
      contentClassName="space-y-6"
    >
      <AgentDashboard context="admin" />
    </AdminPageShell>
  );
}
