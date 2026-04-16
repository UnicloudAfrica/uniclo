import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

const TenantShieldAnalytics: React.FC = () => {
  return (
    <TenantPageShell
      title="Shield Analytics"
      description="Select a domain to view detailed analytics"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="tenant"
        detailBasePath="/dashboard/shield/domains"
      />
    </TenantPageShell>
  );
};

export default TenantShieldAnalytics;
