import React, { useState } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { getRouteTablePermissions, type Hierarchy } from "@/shared/config/permissionPresets";
import { RouteTablesOverview } from "..";
import ToastUtils from "@/utils/toastUtil";
import ModernButton from "../../ui/ModernButton";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";

import { RouteTable, Subnet, InternetGateway, NatGateway } from "../types";

interface RouteTableHooks {
  useList: (
    projectId: string,
    region?: string,
    options?: { enabled?: boolean }
  ) => UseQueryResult<RouteTable[], Error>;
  useSubnets: (
    projectId: string,
    region?: string,
    options?: { enabled?: boolean }
  ) => UseQueryResult<Subnet[], Error>;
  useInternetGateways: (
    projectId: string,
    region?: string,
    options?: { enabled?: boolean }
  ) => UseQueryResult<InternetGateway[], Error>;
  useNatGateways: (
    projectId: string,
    region?: string,
    options?: { enabled?: boolean }
  ) => UseQueryResult<NatGateway[], Error>;

  useCreate: () => UseMutationResult<
    unknown,
    Error,
    { projectId: string; region?: string; payload: { route_table_id: string; [key: string]: unknown } },
    unknown
  >;
  useDelete: () => UseMutationResult<
    unknown,
    Error,
    {
      projectId: string;
      region?: string;
      payload: { route_table_id: string; destination_cidr_block: string };
    },
    unknown
  >;
  useAssociate: () => UseMutationResult<
    unknown,
    Error,
    { projectId: string; region?: string; routeTableId: string; subnetId: string },
    unknown
  >;
  useDisassociate: () => UseMutationResult<
    unknown,
    Error,
    { projectId: string; region?: string; associationId: string },
    unknown
  >;
}

interface RouteTablesContainerProps {
  hierarchy: Hierarchy;
  projectId: string;
  region: string;
  hooks: RouteTableHooks;
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement;
}

const RouteTablesContainer: React.FC<RouteTablesContainerProps> = ({
  hierarchy,
  projectId,
  region,
  hooks,
  wrapper: Wrapper,
}) => {
  const permissions = getRouteTablePermissions(hierarchy);

  const {
    data: routeTables = [],
    isLoading,
    isFetching,
    refetch,
  } = hooks.useList(projectId, region, {
    enabled: Boolean(projectId),
  });
  const { data: subnets = [] } = hooks.useSubnets(projectId, region);
  const { data: internetGateways = [] } = hooks.useInternetGateways(projectId, region);
  const { data: natGateways = [] } = hooks.useNatGateways(projectId, region);

  const createRouteMutation = hooks.useCreate();
  const deleteRouteMutation = hooks.useDelete();
  const associateMutation = hooks.useAssociate();
  const disassociateMutation = hooks.useDisassociate();

  const [deleteRouteConfirm, setDeleteRouteConfirm] = useState<{
    open: boolean;
    data?: { routeTableId: string; destination: string };
  }>({ open: false });

  const [disassociateConfirm, setDisassociateConfirm] = useState<{
    open: boolean;
    data?: { associationId: string };
  }>({ open: false });

  const handleAddRoute = async (routeTableId: string, data: Record<string, unknown>) => {
    if (!permissions.canManageRoutes) return;
    try {
      await createRouteMutation.mutateAsync({
        projectId,
        region,
        payload: { ...data, route_table_id: routeTableId },
      });
      ToastUtils.success("Route added successfully.");
      refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add route.";
      ToastUtils.error(message);
    }
  };

  const handleDeleteRoute = (routeTableId: string, destination: string) => {
    if (!permissions.canManageRoutes) return;
    setDeleteRouteConfirm({ open: true, data: { routeTableId, destination } });
  };

  const confirmDeleteRoute = async () => {
    if (!deleteRouteConfirm.data) return;
    const { routeTableId, destination } = deleteRouteConfirm.data;
    try {
      await deleteRouteMutation.mutateAsync({
        projectId,
        region,
        payload: { route_table_id: routeTableId, destination_cidr_block: destination },
      });
      ToastUtils.success("Route deleted.");
      refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete route.";
      ToastUtils.error(message);
    } finally {
      setDeleteRouteConfirm({ open: false });
    }
  };

  const handleAssociate = async (routeTableId: string, subnetId: string) => {
    if (!permissions.canManageAssociations) return;
    try {
      await associateMutation.mutateAsync({
        projectId,
        region,
        routeTableId,
        subnetId,
      });
      ToastUtils.success("Subnet associated successfully.");
      refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to associate subnet.";
      ToastUtils.error(message);
    }
  };

  const handleDisassociate = (associationId: string) => {
    if (!permissions.canManageAssociations) return;
    setDisassociateConfirm({ open: true, data: { associationId } });
  };

  const confirmDisassociate = async () => {
    if (!disassociateConfirm.data) return;
    const { associationId } = disassociateConfirm.data;
    try {
      await disassociateMutation.mutateAsync({
        projectId,
        region,
        associationId,
      });
      ToastUtils.success("Subnet disassociated.");
      refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to disassociate subnet.";
      ToastUtils.error(message);
    } finally {
      setDisassociateConfirm({ open: false });
    }
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        {isFetching ? "Refreshing..." : "Refresh"}
      </ModernButton>
    </div>
  );

  return (
    <>
      <Wrapper headerActions={headerActions}>
        <RouteTablesOverview
          routeTables={routeTables}
          subnets={subnets}
          internetGateways={internetGateways}
          natGateways={natGateways}
          isLoading={isLoading}
          permissions={permissions}
          onAddRoute={handleAddRoute}
          onDeleteRoute={handleDeleteRoute}
          onAssociate={handleAssociate}
          onDisassociate={handleDisassociate}
          onRefresh={refetch}
        />
      </Wrapper>

      <ConfirmDialog
        isOpen={deleteRouteConfirm.open}
        title="Delete Route"
        message={`Are you sure you want to delete the route to ${deleteRouteConfirm.data?.destination ?? ""}?`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteRoute}
        onCancel={() => setDeleteRouteConfirm({ open: false })}
        isLoading={deleteRouteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={disassociateConfirm.open}
        title="Disassociate Subnet"
        message="Are you sure you want to disassociate this subnet?"
        confirmLabel="Disassociate"
        variant="warning"
        onConfirm={confirmDisassociate}
        onCancel={() => setDisassociateConfirm({ open: false })}
        isLoading={disassociateMutation.isPending}
      />
    </>
  );
};

export default RouteTablesContainer;
export type { RouteTableHooks };
