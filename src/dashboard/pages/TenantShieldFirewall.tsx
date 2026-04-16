import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

const TenantShieldFirewall: React.FC = () => {
  return (
    <TenantPageShell
      title="Shield Firewall"
      description="Select a domain to manage its firewall rules"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="tenant"
        detailBasePath="/dashboard/shield/domains"
      />
    </TenantPageShell>
  );
};

export default TenantShieldFirewall;
