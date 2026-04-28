import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton, LoadingState, ErrorState } from "@/shared/components/ui";
import NocTopologyGraph from "@/shared/components/noc/NocTopologyGraph";
import { useFetchNocTopology } from "@/hooks/adminHooks/nocHooks";

const AdminNocTopology: React.FC = () => {
  const { code = "", vpcId = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useFetchNocTopology(code, vpcId);

  return (
    <AdminPageShell
      title="VPC Topology"
      description={`Network topology for VPC ${vpcId.slice(0, 8)}… in ${code}`}
      actions={
        <ModernButton
          variant="ghost"
          onClick={() => navigate(`/admin-dashboard/noc/regions/${code}`)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to region
        </ModernButton>
      }
    >
      {isLoading ? (
        <LoadingState message="Building topology graph…" />
      ) : isError ? (
        <ErrorState
          title="Couldn't load topology"
          message="The provider didn't return VPC, subnet, or VM data. Try refreshing."
          onRetry={() => refetch()}
        />
      ) : (
        <NocTopologyGraph
          nodes={(data?.nodes ?? []) as Parameters<typeof NocTopologyGraph>[0]["nodes"]}
          edges={(data?.edges ?? []) as Parameters<typeof NocTopologyGraph>[0]["edges"]}
        />
      )}
    </AdminPageShell>
  );
};

export default AdminNocTopology;
