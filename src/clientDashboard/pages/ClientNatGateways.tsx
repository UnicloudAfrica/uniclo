import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import NatGatewaysContainer, {
  NatGatewayHooks,
} from "../../shared/components/infrastructure/containers/NatGatewaysContainer";
import {
  useNatGateways,
  useCreateNatGateway,
  useDeleteNatGateway,
} from "../../shared/hooks/vpcInfraHooks";

const ClientNatGateways: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const hooks: NatGatewayHooks = {
    useList: useNatGateways as NatGatewayHooks["useList"],
    useCreate: useCreateNatGateway as NatGatewayHooks["useCreate"],
    useDelete: useDeleteNatGateway as NatGatewayHooks["useDelete"],
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
