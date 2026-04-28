import React from "react";
import ElasticIpsContainer from "@/shared/components/infrastructure/containers/ElasticIpsContainer";
import {
  useElasticIps,
  useCreateElasticIp,
  useDeleteElasticIp,
  useAssociateElasticIp,
  useDisassociateElasticIp,
} from "@/shared/hooks/vpcInfraHooks";
import { ResourceSection } from "@/shared/components/ui";

const useElasticIpsAdapter = (projectId: string, region?: string) => {
  const q = useElasticIps(projectId, region);
  return { data: (q.data ?? []) as unknown[], isLoading: q.isLoading, refetch: q.refetch };
};

const EIPs = ({ projectId = "", region = "" }: { projectId?: string; region?: string }) => {
  return (
    <ElasticIpsContainer
      hierarchy="admin"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useElasticIpsAdapter as never,
        useCreate: useCreateElasticIp as never,
        useDelete: useDeleteElasticIp as never,
        useAssociate: useAssociateElasticIp as never,
        useDisassociate: useDisassociateElasticIp as never,
      }}
      wrapper={({
        headerActions,
        children,
      }: {
        headerActions: unknown;
        children: React.ReactNode;
      }) => (
        <ResourceSection
          title="Elastic IPs"
          description="Manage static public IP addresses for your infrastructure."
          actions={headerActions as React.ReactNode}
        >
          {children}
        </ResourceSection>
      )}
    />
  );
};

export default EIPs;
