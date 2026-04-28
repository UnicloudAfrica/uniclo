import React from "react";
import NetworkInterfacesContainer from "@/shared/components/infrastructure/containers/NetworkInterfacesContainer";
import {
  useFetchNetworkInterfaces,
  syncNetworkInterfacesFromProvider,
} from "@/hooks/adminHooks/networkHooks";
import { ResourceSection } from "@/shared/components/ui";

const useFetchNetworkInterfacesAdapter = (projectId: string, region: string) => {
  const q = useFetchNetworkInterfaces(projectId, region);
  return {
    data: (q.data as Record<string, unknown>[]) || [],
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
};

const ENIs = ({ projectId = "", region = "" }: { projectId?: string; region?: string }) => {
  return (
    <NetworkInterfacesContainer
      hierarchy="admin"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useFetchNetworkInterfacesAdapter as unknown,
        onSync: projectId
          ? () =>
              syncNetworkInterfacesFromProvider({
                project_id: projectId,
                region,
              })
          : undefined,
      }}
      wrapper={({
        headerActions,
        children,
      }: {
        headerActions?: React.ReactNode;
        children: React.ReactNode;
      }) => (
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
