import { useParams } from "react-router-dom";
import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { ShieldDomainDetail } from "@/shared/components/shield";

const TenantShieldDomainDetail: React.FC = () => {
  const { domainId } = useParams<{ domainId: string }>();

  return (
    <TenantPageShell
      title="Domain Details"
      description="View and manage domain protection"
      contentClassName="space-y-6"
    >
      <ShieldDomainDetail
        identifier={domainId || ""}
        backPath="/dashboard/shield/domains"
        context="tenant"
      />
    </TenantPageShell>
  );
};

export default TenantShieldDomainDetail;
