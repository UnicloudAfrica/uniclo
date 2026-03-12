import React from "react";
import NetworkInterfacesContainer from "@/shared/components/infrastructure/containers/NetworkInterfacesContainer";
import { useFetchTenantNetworkInterfaces, useSyncTenantNetworkInterfaces } from "@/hooks/eni";
import { ResourceSection } from "@/shared/components/ui";

const useFetchNetworkInterfacesAdapter = (projectId: string, region: string) => {
  const q = useFetchTenantNetworkInterfaces(projectId, region);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

const ENIs = ({ projectId = "", region = "" }: any) => {
  const syncMutation = useSyncTenantNetworkInterfaces();

  return (
    <NetworkInterfacesContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useFetchNetworkInterfacesAdapter as any,
        onSync: projectId
          ? async () => {
              await syncMutation.mutateAsync({
                project_id: projectId,
                region,
              });
            }
          : undefined,
      }}
      wrapper={({ headerActions, children }: any) => (
        <ResourceSection
          title="Network Interfaces"
          description="View and manage virtual NICs attached to instances."
          actions={headerActions}
        >
          {children}
        </ResourceSection>
      )}
    />
  );
};

export default ENIs;
