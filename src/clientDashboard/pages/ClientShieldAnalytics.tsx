import ClientPageShell from "../components/ClientPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

const ClientShieldAnalytics: React.FC = () => {
  return (
    <ClientPageShell
      title="Shield Analytics"
      description="Select a domain to view detailed analytics"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="client"
        detailBasePath="/client-dashboard/shield/domains"
      />
    </ClientPageShell>
  );
};

export default ClientShieldAnalytics;
