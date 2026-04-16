import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

const TenantShieldAttacks: React.FC = () => {
  return (
    <TenantPageShell
      title="Shield Attacks"
      description="Select a domain to view its attack history"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="tenant"
        detailBasePath="/dashboard/shield/domains"
      />
    </TenantPageShell>
  );
};

export default TenantShieldAttacks;
