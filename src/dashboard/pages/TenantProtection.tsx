import TenantPageShell from "../components/TenantPageShell";
import ProtectionLanding from "@/shared/components/integrations/ProtectionLanding";

const TenantProtection: React.FC = () => {
  return (
    <ProtectionLanding
      PageShell={TenantPageShell}
      context="tenant"
      basePath="/dashboard"
      description="Manage replication policies, bidirectional sync, quorum, and traffic control"
    />
  );
};

export default TenantProtection;
