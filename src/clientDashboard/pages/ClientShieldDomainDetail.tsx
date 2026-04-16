import { useParams } from "react-router-dom";
import ClientPageShell from "../components/ClientPageShell";
import { ShieldDomainDetail } from "@/shared/components/shield";

const ClientShieldDomainDetail: React.FC = () => {
  const { domainId } = useParams<{ domainId: string }>();

  return (
    <ClientPageShell
      title="Domain Details"
      description="View and manage domain protection"
      contentClassName="space-y-6"
    >
      <ShieldDomainDetail
        identifier={domainId || ""}
        backPath="/client-dashboard/shield/domains"
        context="client"
      />
    </ClientPageShell>
  );
};

export default ClientShieldDomainDetail;
