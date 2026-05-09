import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import NatGatewaysContainer, {
  type NatGatewayHooks,
} from "@/shared/components/infrastructure/containers/NatGatewaysContainer";
import {
  useNatGateways,
  useCreateNatGateway,
  useDeleteNatGateway,
} from "@/shared/hooks/vpcInfraHooks";
import { useFetchProjectById } from "@/shared/hooks/resources/projectHooks";
import { UnsupportedFeature } from "@/shared/components/UnsupportedFeature";

const TenantNatGateways: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const { data: projectData } = useFetchProjectById(projectId);
  const project =
    projectData && typeof projectData === "object" ? (projectData as Record<string, unknown>) : null;
  const providerFeatures = project?.provider_features as Record<string, boolean> | undefined;
  const supportsNatGateways = providerFeatures?.nat_gateways ?? true;

  if (!supportsNatGateways) {
    return (
      <TenantPageShell title="NAT Gateways" description="">
        <UnsupportedFeature feature="NAT Gateways" />
      </TenantPageShell>
    );
  }

  // Tenant uses same hooks, permission gating handled by container
  const hooks: NatGatewayHooks = {
    useList: useNatGateways as unknown as NatGatewayHooks["useList"],
    useCreate: useCreateNatGateway as unknown as NatGatewayHooks["useCreate"],
    useDelete: useDeleteNatGateway as unknown as NatGatewayHooks["useDelete"],
  };

  return (
    <NatGatewaysContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <TenantPageShell
          title={
            <span className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              NAT Gateways
            </span>
          }
          description="Enable outbound internet access for private subnets"
          actions={headerActions}
        >
          {children}
        </TenantPageShell>
      )}
    />
  );
};

export default TenantNatGateways;
