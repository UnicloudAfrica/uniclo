import ClientPageShell from "../components/ClientPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

const ClientShieldDomains: React.FC = () => {
  return (
    <ClientPageShell
      title="Shield Domains"
      description="Manage your protected domains"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="client"
        detailBasePath="/client-dashboard/shield/domains"
      />
    </ClientPageShell>
  );
};

export default ClientShieldDomains;
