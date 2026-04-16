import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

const TenantShieldDomains: React.FC = () => {
  return (
    <TenantPageShell
      title="Shield Domains"
      description="Manage your protected domains"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="tenant"
        detailBasePath="/dashboard/shield/domains"
      />
    </TenantPageShell>
  );
};

export default TenantShieldDomains;
