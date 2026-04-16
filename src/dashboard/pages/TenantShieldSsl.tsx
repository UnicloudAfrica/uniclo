import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

const TenantShieldSsl: React.FC = () => {
  return (
    <TenantPageShell
      title="Shield SSL"
      description="Select a domain to manage its SSL certificates"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="tenant"
        detailBasePath="/dashboard/shield/domains"
      />
    </TenantPageShell>
  );
};

export default TenantShieldSsl;
