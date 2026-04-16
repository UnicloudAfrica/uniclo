import ClientPageShell from "../components/ClientPageShell";
import { ShieldOverviewDashboard } from "@/shared/components/shield";

const ClientShieldOverview: React.FC = () => {
  return (
    <ClientPageShell
      title="Shield Overview"
      description="DDoS protection overview"
      contentClassName="space-y-6"
    >
      <ShieldOverviewDashboard context="client" />
    </ClientPageShell>
  );
};

export default ClientShieldOverview;
