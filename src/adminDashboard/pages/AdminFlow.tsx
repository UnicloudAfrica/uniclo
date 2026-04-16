import AdminPageShell from "../components/AdminPageShell";
import AdminFlowManagement from "@/shared/components/flow/AdminFlowManagement";

export default function AdminFlow() {
  return (
    <AdminPageShell
      title="UniCloudFlow"
      description="Manage Flow plans, subscriptions, and provision tenants."
    >
      <AdminFlowManagement />
    </AdminPageShell>
  );
}
