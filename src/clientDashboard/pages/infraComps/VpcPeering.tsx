import React from "react";
import VpcPeeringContainer from "@/shared/components/infrastructure/containers/VpcPeeringContainer";
import {
  useVpcPeering,
  useCreateVpcPeering,
  useDeleteVpcPeering,
  useAcceptVpcPeering,
  useRejectVpcPeering,
  useVpcs,
} from "@/shared/hooks/vpcInfraHooks";
import { ResourceSection } from "@/shared/components/ui";

const useVpcPeeringAdapter = (projectId: string, region?: string) => {
  const q = useVpcPeering(projectId, region);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

const useVpcsAdapter = (projectId: string, region?: string) => {
  const q = useVpcs(projectId, region);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

const VpcPeeringPage = ({
  projectId = "",
  region = "",
}: {
  projectId?: string;
  region?: string;
}) => {
  return (
    <VpcPeeringContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useVpcPeeringAdapter as never,
        useVpcs: useVpcsAdapter as never,
        useCreate: useCreateVpcPeering as never,
        useAccept: useAcceptVpcPeering as never,
        useReject: useRejectVpcPeering as never,
        useDelete: useDeleteVpcPeering as never,
      }}
      wrapper={({
        headerActions,
        children,
      }: {
        headerActions: React.ReactNode;
        children: React.ReactNode;
      }) => (
        <ResourceSection
          title="VPC Peering"
          description="Manage private connectivity between Virtual Private Clouds."
          actions={headerActions}
        >
          {children}
        </ResourceSection>
      )}
    />
  );
};

export default VpcPeeringPage;
