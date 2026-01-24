// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import NatGatewaysContainer from "../../shared/components/infrastructure/containers/NatGatewaysContainer";
// Client uses specific client hooks if available, or generic ones?
// VPC hooks usually generic. Let's use generic shared hooks but verify they handle client context.
// useNatGateways is from vpcInfraHooks.js which is usually generic in shared/hooks.
// But earlier checks showed vpcInfraHooks.js uses useApiContext.
import {
  useNatGateways,
  useCreateNatGateway,
  useDeleteNatGateway,
} from "../../shared/hooks/vpcInfraHooks";

const ClientNatGateways: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const hooks = {
    useList: useNatGateways,
    useCreate: useCreateNatGateway,
    useDelete: useDeleteNatGateway,
  };

  return (
    <NatGatewaysContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              NAT Gateways
            </span>
          }
          description="Outbound internet access for private subnets"
          actions={headerActions}
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientNatGateways;
