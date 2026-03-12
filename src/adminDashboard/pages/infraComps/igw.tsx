import React from "react";
import InternetGatewaysContainer from "@/shared/components/infrastructure/containers/InternetGatewaysContainer";
import {
  useInternetGateways,
  useCreateInternetGateway,
  useDeleteInternetGateway,
  useAttachInternetGateway,
  useDetachInternetGateway,
  useVpcs,
} from "@/shared/hooks/vpcInfraHooks";
import { ResourceSection } from "@/shared/components/ui";

const useInternetGatewaysAdapter = (projectId: string, region?: string) => {
  const q = useInternetGateways(projectId, region);
  return {
    data: (q.data as Record<string, unknown>[]) || [],
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
};

const useVpcsAdapter = (projectId: string, region?: string) => {
  const q = useVpcs(projectId, region);
  return {
    data: (q.data as Record<string, unknown>[]) || [],
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
};

const IGWs = ({
  projectId = "",
  region = "",
}: {
  projectId?: string;
  region?: string;
  [key: string]: unknown;
}) => {
  return (
    <InternetGatewaysContainer
      hierarchy="admin"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useInternetGatewaysAdapter as never,
        useVpcs: useVpcsAdapter as never,
        useCreate: useCreateInternetGateway as never,
        useDelete: useDeleteInternetGateway as never,
        useAttach: useAttachInternetGateway as never,
        useDetach: useDetachInternetGateway as never,
      }}
      wrapper={({
        headerActions,
        children,
      }: {
        headerActions?: React.ReactNode;
        children?: React.ReactNode;
      }) => (
        <ResourceSection
          title="Internet Gateways"
          description="Manage public ingress and egress for your VPCs."
          actions={headerActions}
        >
          {children}
        </ResourceSection>
      )}
    />
  );
};

export default IGWs;
