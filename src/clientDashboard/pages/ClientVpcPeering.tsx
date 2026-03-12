import React from "react";
import { useSearchParams } from "react-router-dom";
import { GitMerge } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import { VpcPeeringOverview } from "@/shared/components/infrastructure";
import { useVpcPeering } from "@/shared/hooks/vpcInfraHooks";
import { useFetchProjectById } from "@/shared/hooks/resources/projectHooks";
import { isFeatureSupported } from "@/utils/featureGating";
import { UnsupportedFeature } from "@/shared/components/UnsupportedFeature";

const ClientVpcPeering: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const { data: projectData } = useFetchProjectById(projectId);
  const project =
    projectData && typeof projectData === "object" ? (projectData as Record<string, any>) : null;
  const provider = project?.provider || searchParams.get("provider");

  const { data: peeringConnections = [], isLoading } = useVpcPeering(projectId, region);

  if (provider && !isFeatureSupported(provider, "vpc_peering")) {
    return (
      <ClientPageShell title="VPC Peering" description="">
        <UnsupportedFeature feature="VPC Peering" provider={provider} />
      </ClientPageShell>
    );
  }

  return (
    <ClientPageShell
      title={
        <span className="flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-violet-600" />
          VPC Peering
        </span>
      }
      description="VPC connections for private communication"
    >
      <VpcPeeringOverview peeringConnections={peeringConnections} isLoading={isLoading} />
    </ClientPageShell>
  );
};

export default ClientVpcPeering;
