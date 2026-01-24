// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import InternetGatewaysContainer from "../../shared/components/infrastructure/containers/InternetGatewaysContainer";
import {
  useInternetGateways,
  useVpcs,
  useCreateInternetGateway,
  useDeleteInternetGateway,
  useAttachInternetGateway,
  useDetachInternetGateway,
} from "../../shared/hooks/vpcInfraHooks";

const ClientInternetGateways: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const hooks = {
    useList: useInternetGateways,
    useVpcs: useVpcs,
    useCreate: useCreateInternetGateway,
    useDelete: useDeleteInternetGateway,
    useAttach: useAttachInternetGateway,
    useDetach: useDetachInternetGateway,
  };

  return (
    <InternetGatewaysContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Internet Gateways
            </span>
          }
          description="Internet connectivity points for your VPCs"
          actions={headerActions}
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientInternetGateways;
