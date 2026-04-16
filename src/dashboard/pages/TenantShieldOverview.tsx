import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { ShieldOverviewDashboard } from "@/shared/components/shield";

const TenantShieldOverview: React.FC = () => {
  return (
    <TenantPageShell
      title="Shield Overview"
      description="DDoS protection overview"
      contentClassName="space-y-6"
    >
      <ShieldOverviewDashboard context="tenant" />
    </TenantPageShell>
  );
};

export default TenantShieldOverview;
