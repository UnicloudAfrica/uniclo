import ClientPageShell from "../components/ClientPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

const ClientShieldSsl: React.FC = () => {
  return (
    <ClientPageShell
      title="Shield SSL"
      description="Select a domain to manage its SSL certificates"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="client"
        detailBasePath="/client-dashboard/shield/domains"
      />
    </ClientPageShell>
  );
};

export default ClientShieldSsl;
