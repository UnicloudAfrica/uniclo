import React from "react";
import NetworkInterfacesContainer from "@/shared/components/infrastructure/containers/NetworkInterfacesContainer";
import {
  useFetchClientNetworkInterfaces,
  syncClientNetworkInterfacesFromProvider,
} from "@/hooks/clientHooks/networkHooks";
import { ResourceSection } from "@/shared/components/ui";

const useFetchNetworkInterfacesAdapter = (projectId: string, region: string) => {
  const q = useFetchClientNetworkInterfaces(projectId, region);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

interface ENIsProps {
  projectId?: string;
  region?: string;
}

const ENIs = ({ projectId = "", region = "" }: ENIsProps) => {
  return (
    <NetworkInterfacesContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useFetchNetworkInterfacesAdapter as never,
        onSync: projectId
          ? () =>
              syncClientNetworkInterfacesFromProvider({
                project_id: projectId,
                region,
              })
          : undefined,
      }}
      wrapper={({ headerActions, children }: { headerActions: React.ReactNode; children: React.ReactNode }) => (
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
