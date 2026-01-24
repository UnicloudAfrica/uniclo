// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import InternetGatewaysContainer from "../../../shared/components/infrastructure/containers/InternetGatewaysContainer";
import {
  useInternetGateways,
  useVpcs,
  useCreateInternetGateway,
  useDeleteInternetGateway,
  useAttachInternetGateway,
  useDetachInternetGateway,
} from "../../../shared/hooks/vpcInfraHooks";

const TenantInternetGateways: React.FC = () => {
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
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <TenantPageShell
          title={
            <span className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Internet Gateways
            </span>
          }
          description="View Internet Gateways associated with your VPCs"
          actions={headerActions}
        >
          {children}
        </TenantPageShell>
      )}
    />
  );
};

export default TenantInternetGateways;
