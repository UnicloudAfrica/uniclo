import React from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import VpcsContainer from "@/shared/components/infrastructure/containers/VpcsContainer";
import { useVpcs, useCreateVpc, useDeleteVpc } from "@/shared/hooks/vpcInfraHooks";
import { ResourceSection } from "@/shared/components/ui";
import { Vpc } from "@/shared/components/infrastructure/types";

const useVpcsAdapter = (projectId: string, region?: string, options?: unknown) => {
  const q = useVpcs(projectId, region, options as { enabled?: boolean });
  return { ...q, data: q.data ?? [] } as UseQueryResult<Vpc[], Error>;
};

interface VPCsProps {
  projectId?: string;
  region?: string;
}

const VPCs: React.FC<VPCsProps> = ({ projectId = "", region = "" }) => {
  return (
    <VpcsContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useVpcsAdapter,
        useCreate: useCreateVpc,
        useDelete: useDeleteVpc,
      }}
      wrapper={({ headerActions, children }) => (
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
