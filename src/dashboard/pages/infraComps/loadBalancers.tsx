import React from "react";
import LoadBalancersContainer from "@/shared/components/infrastructure/containers/LoadBalancersContainer";
import { useLoadBalancers, useDeleteLoadBalancer } from "@/hooks/adminHooks/loadBalancerHooks";
import { ResourceSection } from "@/shared/components/ui";

const useLoadBalancersAdapter = (projectId: string, _region?: string) => {
  const q = useLoadBalancers(projectId);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

interface LoadBalancersProps {
  projectId?: string;
  region?: string;
}

const LoadBalancersPage: React.FC<LoadBalancersProps> = ({ projectId = "", region = "" }) => {
  return (
    <LoadBalancersContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useLoadBalancersAdapter as never,
        useDelete: useDeleteLoadBalancer as never,
      }}
      wrapper={({ headerActions, children }) => (
        <ResourceSection
          title="Load Balancers"
          description="Distribute traffic across instances for high availability."
          actions={headerActions}
        >
          {children}
        </ResourceSection>
      )}
    />
  );
};

export default LoadBalancersPage;
