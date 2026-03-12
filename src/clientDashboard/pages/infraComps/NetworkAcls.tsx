import React from "react";
import NetworkAclsContainer from "@/shared/components/infrastructure/containers/NetworkAclsContainer";
import {
  useNetworkAcls,
  useCreateNetworkAcl,
  useDeleteNetworkAcl,
  useVpcs,
} from "@/shared/hooks/vpcInfraHooks";
import { ResourceSection } from "@/shared/components/ui";

const useNetworkAclsAdapter = (projectId: string, region?: string) => {
  const q = useNetworkAcls(projectId, region);
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

const NetworkAclsPage = ({
  projectId = "",
  region = "",
}: {
  projectId?: string;
  region?: string;
}) => {
  return (
    <NetworkAclsContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useNetworkAclsAdapter as never,
        useVpcs: useVpcsAdapter as never,
        useCreate: useCreateNetworkAcl as never,
        useDelete: useDeleteNetworkAcl as never,
      }}
      onManageRules={() => {}}
      wrapper={({
        headerActions,
        children,
      }: {
        headerActions: React.ReactNode;
        children: React.ReactNode;
      }) => (
        <ResourceSection
          title="Network ACLs"
          description="Manage subnet-level stateless network access control lists."
          actions={headerActions}
        >
          {children}
        </ResourceSection>
      )}
    />
  );
};

export default NetworkAclsPage;
