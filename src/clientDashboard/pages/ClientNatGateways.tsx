import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import NatGatewaysContainer, {
  NatGatewayHooks,
} from "@/shared/components/infrastructure/containers/NatGatewaysContainer";
import {
  useNatGateways,
  useCreateNatGateway,
  useDeleteNatGateway,
} from "@/shared/hooks/vpcInfraHooks";
import { useFetchProjectById } from "@/shared/hooks/resources/projectHooks";
import { isFeatureSupported } from "@/utils/featureGating";
import { UnsupportedFeature } from "@/shared/components/UnsupportedFeature";

const ClientNatGateways: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const { data: projectData } = useFetchProjectById(projectId);
  const project =
    projectData && typeof projectData === "object" ? (projectData as Record<string, unknown>) : null;
  const provider = (project?.provider as string | undefined) || searchParams.get("provider");

  if (provider && !isFeatureSupported(provider, "nat_gateways")) {
    return (
      <ClientPageShell title="NAT Gateways" description="">
        <UnsupportedFeature feature="NAT Gateways" provider={provider} />
      </ClientPageShell>
    );
  }

  const hooks: NatGatewayHooks = {
    useList: useNatGateways as unknown as NatGatewayHooks["useList"],
    useCreate: useCreateNatGateway as unknown as NatGatewayHooks["useCreate"],
    useDelete: useDeleteNatGateway as unknown as NatGatewayHooks["useDelete"],
  };

  return (
    <NatGatewaysContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              NAT Gateways
            </span>
          }
          description="Outbound internet access for private subnets"
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientNatGateways;
