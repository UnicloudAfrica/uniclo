import React from "react";
import VpcsContainer from "@/shared/components/infrastructure/containers/VpcsContainer";
import { useVpcs, useCreateVpc, useDeleteVpc } from "@/shared/hooks/vpcInfraHooks";
import { ResourceSection } from "@/shared/components/ui";

const useVpcsAdapter = (projectId: string, region?: string) => {
  const q = useVpcs(projectId, region);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

interface VPCsProps {
  projectId?: string;
  region?: string;
}

const VPCs = ({ projectId = "", region = "" }: VPCsProps) => {
  return (
    <VpcsContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useVpcsAdapter as never,
        useCreate: useCreateVpc as never,
        useDelete: useDeleteVpc as never,
      }}
      wrapper={({ headerActions, children }: { headerActions: React.ReactNode; children: React.ReactNode }) => (
        <ResourceSection
          title="VPCs"
          description="Manage Virtual Private Clouds for isolated project networking."
          actions={headerActions}
        >
          {children}
        </ResourceSection>
      )}
    />
  );
};

export default VPCs;
