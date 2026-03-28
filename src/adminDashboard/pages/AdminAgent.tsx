import AdminPageShell from "../components/AdminPageShell";
import AgentDashboard from "@/shared/components/integrations/agent/AgentDashboard";

export default function AdminAgent() {
  return (
    <AdminPageShell
      title="Infrastructure Agent"
      description="Automated monitoring rules and approval-based actions for replication, backup, and DR."
      contentClassName="space-y-6"
    >
      <AgentDashboard context="admin" />
    </AdminPageShell>
  );
}
