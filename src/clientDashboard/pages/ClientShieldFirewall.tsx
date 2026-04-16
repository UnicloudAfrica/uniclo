import ClientPageShell from "../components/ClientPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

const ClientShieldFirewall: React.FC = () => {
  return (
    <ClientPageShell
      title="Shield Firewall"
      description="Select a domain to manage its firewall rules"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="client"
        detailBasePath="/client-dashboard/shield/domains"
      />
    </ClientPageShell>
  );
};

export default ClientShieldFirewall;
