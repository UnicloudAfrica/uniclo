// @ts-nocheck
import React from "react";
import { RefreshCw } from "lucide-react";
import {
  getInternetGatewayPermissions,
  type Hierarchy,
  type InternetGatewayPermissions,
} from "../../../config/permissionPresets";
import { InternetGatewaysOverview } from "..";
import ToastUtils from "../../../../utils/toastUtil";
import ModernButton from "../../ui/ModernButton";

interface InternetGatewayHooks {
  useList: (
    projectId: string,
    region?: string,
    options?: any
  ) => { data: any[]; isLoading: boolean; refetch: () => void };
  useVpcs: (projectId: string, region?: string) => { data: any[] };

  useCreate: () => { mutateAsync: (input: any) => Promise<any>; isPending: boolean };
  useDelete: () => { mutateAsync: (input: any) => Promise<any>; isPending: boolean };
  useAttach: () => { mutateAsync: (input: any) => Promise<any>; isPending: boolean };
  useDetach: () => { mutateAsync: (input: any) => Promise<any>; isPending: boolean };
}

interface InternetGatewaysContainerProps {
  hierarchy: Hierarchy;
  projectId: string;
  region: string;
  hooks: InternetGatewayHooks;
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement;
  onStatsUpdate?: (count: number) => void;
}

const InternetGatewaysContainer: React.FC<InternetGatewaysContainerProps> = ({
  hierarchy,
  projectId,
  region,
  hooks,
  wrapper: Wrapper,
}) => {
  const permissions = getInternetGatewayPermissions(hierarchy);

  const {
    data: gateways = [],
    isLoading,
    refetch,
  } = hooks.useList(projectId, region, {
    enabled: Boolean(projectId),
  });
  const { data: vpcs = [] } = hooks.useVpcs(projectId, region);

  const createMutation = hooks.useCreate();
  const deleteMutation = hooks.useDelete();
  const attachMutation = hooks.useAttach();
  const detachMutation = hooks.useDetach();

  const handleCreate = async (name: string) => {
    if (!permissions.canCreate) return;
    try {
      await createMutation.mutateAsync({
        projectId,
        region,
        payload: { name },
      });
      ToastUtils.success("Internet Gateway created successfully.");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Failed to create gateway.");
    }
  };

  const handleDelete = async (igwId: string) => {
    if (!permissions.canDelete) return;
    if (!confirm("Delete this Internet Gateway?")) return;
    try {
      await deleteMutation.mutateAsync({
        projectId,
        region,
        igwId,
      });
      ToastUtils.success("Internet Gateway deleted.");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Failed to delete gateway.");
    }
  };

  const handleAttach = async (igwId: string, vpcId: string) => {
    if (!permissions.canAttach) return;
    try {
      await attachMutation.mutateAsync({
        projectId,
        region,
        igwId,
        vpcId,
      });
      ToastUtils.success("Gateway attached successfully.");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Failed to attach gateway.");
    }
  };

  const handleDetach = async (igwId: string, vpcId: string) => {
    if (!permissions.canDetach) return;
    if (!confirm("Detach this Gateway from VPC?")) return;
    try {
      await detachMutation.mutateAsync({
        projectId,
        region,
        igwId,
        vpcId,
      });
      ToastUtils.success("Gateway detached.");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Failed to detach gateway.");
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
      <InternetGatewaysOverview
        gateways={gateways}
        vpcs={vpcs}
        isLoading={isLoading}
        permissions={permissions}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onAttach={handleAttach}
        onDetach={handleDetach}
        isCreating={createMutation.isPending}
        isAttaching={attachMutation.isPending}
      />
    </Wrapper>
  );
};

export default InternetGatewaysContainer;
export type { InternetGatewayHooks };
