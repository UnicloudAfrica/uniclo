import ClientPageShell from "../components/ClientPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

const ClientShieldAttacks: React.FC = () => {
  return (
    <ClientPageShell
      title="Shield Attacks"
      description="Select a domain to view its attack history"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="client"
        detailBasePath="/client-dashboard/shield/domains"
      />
    </ClientPageShell>
  );
};

export default ClientShieldAttacks;
