import ClientPageShell from "../components/ClientPageShell";
import ProtectionLanding from "@/shared/components/integrations/ProtectionLanding";

const ClientProtection: React.FC = () => {
  return (
    <ProtectionLanding
      PageShell={ClientPageShell}
      context="client"
      basePath="/client-dashboard"
      description="View replication policies and disaster recovery status for your resources"
    />
  );
};

export default ClientProtection;
