import React from "react";
import NatGatewaysContainer from "@/shared/components/infrastructure/containers/NatGatewaysContainer";
import {
  useNatGateways,
  useCreateNatGateway,
  useDeleteNatGateway,
} from "@/shared/hooks/vpcInfraHooks";
import { ResourceSection } from "@/shared/components/ui";

const useNatGatewaysAdapter = (projectId: string, region?: string) => {
  const q = useNatGateways(projectId, region);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

interface NatGatewaysProps {
  projectId?: string;
  region?: string;
}

const NatGateways: React.FC<NatGatewaysProps> = ({ projectId = "", region = "" }) => {
  return (
    <NatGatewaysContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useNatGatewaysAdapter as never,
        useCreate: useCreateNatGateway as never,
        useDelete: useDeleteNatGateway as never,
      }}
      wrapper={({ headerActions, children }) => (
        <ResourceSection
          title="NAT Gateways"
          description="Manage outbound internet access for private subnets."
          actions={headerActions}
        >
          {children}
        </ResourceSection>
      )}
    />
  );
};

export default NatGateways;
