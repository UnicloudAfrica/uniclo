import React from "react";
import SubnetsContainer from "@/shared/components/infrastructure/containers/SubnetsContainer";
import {
  useSubnets,
  useCreateSubnet,
  useDeleteSubnet,
  useVpcs,
} from "@/shared/hooks/vpcInfraHooks";
import { ResourceSection } from "@/shared/components/ui";

const useSubnetsAdapter = (projectId: string, region?: string) => {
  const q = useSubnets(projectId, region);
  return { data: (q.data ?? []) as unknown[], isLoading: q.isLoading, refetch: q.refetch };
};

const useVpcsAdapter = (projectId: string, region?: string) => {
  const q = useVpcs(projectId, region);
  return { data: (q.data ?? []) as unknown[], isLoading: q.isLoading, refetch: q.refetch };
};

const Subnets = ({ projectId = "", region = "" }: { projectId?: string; region?: string }) => {
  return (
    <SubnetsContainer
      hierarchy="admin"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useSubnetsAdapter as never,
        useCreate: useCreateSubnet as never,
        useDelete: useDeleteSubnet as never,
        useVpcs: useVpcsAdapter as never,
      }}
      wrapper={({
        headerActions,
        children,
      }: {
        headerActions: unknown;
        children: React.ReactNode;
      }) => (
        <ResourceSection
          title="Subnets"
          description="Manage subnet segments within your VPCs."
          actions={headerActions as React.ReactNode}
        >
          {children}
        </ResourceSection>
      )}
    />
  );
};

export default Subnets;
