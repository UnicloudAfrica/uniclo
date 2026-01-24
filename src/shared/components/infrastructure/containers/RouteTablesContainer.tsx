// @ts-nocheck
import React from "react";
import { Plus, RefreshCw } from "lucide-react";
import {
  getRouteTablePermissions,
  type Hierarchy,
  type RouteTablePermissions,
} from "../../../config/permissionPresets";
import { RouteTablesOverview } from "..";
import ToastUtils from "../../../../utils/toastUtil";
import ModernButton from "../../ui/ModernButton";

interface RouteTableHooks {
  useList: (
    projectId: string,
    region?: string,
    options?: any
  ) => { data: any[]; isLoading: boolean; refetch: () => void };
  useSubnets: (projectId: string, region?: string) => { data: any[] };
  useInternetGateways: (projectId: string, region?: string) => { data: any[] };
  useNatGateways: (projectId: string, region?: string) => { data: any[] };

  useCreate: () => { mutateAsync: (input: any) => Promise<any>; isPending: boolean };
  useDelete: () => { mutateAsync: (input: any) => Promise<any>; isPending: boolean };
  useAssociate: () => { mutateAsync: (input: any) => Promise<any>; isPending: boolean };
  useDisassociate: () => { mutateAsync: (input: any) => Promise<any>; isPending: boolean };
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
  onStatsUpdate?: (count: number) => void;
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

  const handleAddRoute = async (routeTableId: string, data: any) => {
    if (!permissions.canManageRoutes) return;
    try {
      await createRouteMutation.mutateAsync({
        projectId,
        region,
        payload: { ...data, route_table_id: routeTableId },
      });
      ToastUtils.success("Route added successfully.");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Failed to add route.");
    }
  };

  const handleDeleteRoute = async (routeTableId: string, destination: string) => {
    if (!permissions.canManageRoutes) return;
    if (!confirm(`Delete route to ${destination}?`)) return;
    try {
      await deleteRouteMutation.mutateAsync({
        projectId,
        region,
        payload: { route_table_id: routeTableId, destination_cidr_block: destination },
      });
      ToastUtils.success("Route deleted.");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Failed to delete route.");
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
    } catch (error: any) {
      ToastUtils.error(error?.message || "Failed to associate subnet.");
    }
  };

  const handleDisassociate = async (associationId: string) => {
    if (!permissions.canManageAssociations) return;
    if (!confirm("Disassociate this subnet?")) return;
    try {
      await disassociateMutation.mutateAsync({
        projectId,
        region,
        associationId,
      });
      ToastUtils.success("Subnet disassociated.");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Failed to disassociate subnet.");
    }
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="secondary" size="sm" onClick={() => refetch()} disabled={isLoading}>
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
      </ModernButton>
    </div>
  );

  return (
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
  );
};

export default RouteTablesContainer;
export type { RouteTableHooks };
