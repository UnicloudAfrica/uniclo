import AdminPageShell from "../components/AdminPageShell";
import { ShieldOverviewDashboard } from "@/shared/components/shield";

export default function AdminShieldOverview() {
  return (
    <AdminPageShell
      title="Shield Overview"
      description="Platform-wide DDoS protection overview"
      contentClassName="space-y-6"
    >
      <ShieldOverviewDashboard context="admin" />
    </AdminPageShell>
  );
}
