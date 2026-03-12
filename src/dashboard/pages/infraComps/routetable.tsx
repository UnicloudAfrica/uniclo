import React from "react";
import RouteTablesContainer from "@/shared/components/infrastructure/containers/RouteTablesContainer";
import {
  useRouteTables,
  useSubnets,
  useInternetGateways,
  useNatGateways,
  useCreateRoute,
  useDeleteRoute,
  useAssociateRouteTable,
  useDisassociateRouteTable,
} from "@/shared/hooks/vpcInfraHooks";
import { ResourceSection } from "@/shared/components/ui";

const useRouteTablesAdapter = (projectId: string, region?: string) => {
  const q = useRouteTables(projectId, region);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

const useSubnetsAdapter = (projectId: string, region?: string) => {
  const q = useSubnets(projectId, region);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

const useInternetGatewaysAdapter = (projectId: string, region?: string) => {
  const q = useInternetGateways(projectId, region);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

const useNatGatewaysAdapter = (projectId: string, region?: string) => {
  const q = useNatGateways(projectId, region);
  return {
    data: (q.data ?? []) as unknown[],
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    refetch: q.refetch,
  };
};

const RouteTables = ({
  projectId = "",
  region = "",
}: {
  projectId?: string;
  region?: string;
  [key: string]: unknown;
}) => {
  return (
    <RouteTablesContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={{
        useList: useRouteTablesAdapter as never,
        useSubnets: useSubnetsAdapter as never,
        useInternetGateways: useInternetGatewaysAdapter as never,
        useNatGateways: useNatGatewaysAdapter as never,
        useCreate: useCreateRoute as never,
        useDelete: useDeleteRoute as never,
        useAssociate: useAssociateRouteTable as never,
        useDisassociate: useDisassociateRouteTable as never,
      }}
      wrapper={({
        headerActions,
        children,
      }: {
        headerActions?: React.ReactNode;
        children?: React.ReactNode;
      }) => (
        <ResourceSection
          title="Route Tables"
          description="Manage routing rules between subnets and gateways."
          actions={headerActions}
        >
          {children}
        </ResourceSection>
      )}
    />
  );
};

export default RouteTables;
