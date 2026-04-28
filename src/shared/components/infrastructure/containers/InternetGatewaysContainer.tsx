import React, { useState } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { getInternetGatewayPermissions, type Hierarchy } from "@/shared/config/permissionPresets";
import { InternetGatewaysOverview } from "..";
import ToastUtils from "@/utils/toastUtil";
import ModernButton from "../../ui/ModernButton";
import ConfirmDialog from "../../ui/ConfirmDialog";

import { InternetGateway, Vpc } from "../types";

interface InternetGatewayHooks {
  useList: (
    projectId: string,
    region?: string,
    options?: { enabled?: boolean }
  ) => UseQueryResult<InternetGateway[], Error>;
  useVpcs: (
    projectId: string,
    region?: string,
    options?: { enabled?: boolean }
  ) => UseQueryResult<Vpc[], Error>;

  useCreate: () => UseMutationResult<
    InternetGateway,
    Error,
    { projectId: string; region: string; payload: { name: string } },
    unknown
  >;
  useDelete: () => UseMutationResult<
    unknown,
    Error,
    { projectId: string; region: string; igwId: string },
    unknown
  >;
  useAttach: () => UseMutationResult<
    unknown,
    Error,
    { projectId: string; region: string; igwId: string; vpcId: string },
    unknown
  >;
  useDetach: () => UseMutationResult<
    unknown,
    Error,
    { projectId: string; region: string; igwId: string; vpcId: string },
    unknown
  >;
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
}

const InternetGatewaysContainer: React.FC<InternetGatewaysContainerProps> = ({
  hierarchy,
  projectId,
  region,
  hooks,
  wrapper: Wrapper,
}) => {
  const permissions = getInternetGatewayPermissions(hierarchy);

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; data?: string }>({
    open: false,
  });
  const [confirmDetach, setConfirmDetach] = useState<{
    open: boolean;
    data?: { igwId: string; vpcId: string };
  }>({ open: false });

  const {
    data: gateways = [],
    isLoading,
    isFetching,
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
      refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create gateway.";
      ToastUtils.error(message);
    }
  };

  const handleDelete = (igwId: string) => {
    if (!permissions.canDelete) return;
    setConfirmDelete({ open: true, data: igwId });
  };

  const executeDelete = async () => {
    if (!confirmDelete.data) return;
    setConfirmDelete({ open: false });
    try {
      await deleteMutation.mutateAsync({
        projectId,
        region,
        igwId: confirmDelete.data,
      });
      ToastUtils.success("Internet Gateway deleted.");
      refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete gateway.";
      ToastUtils.error(message);
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
      refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to attach gateway.";
      ToastUtils.error(message);
    }
  };

  const handleDetach = (igwId: string, vpcId: string) => {
    if (!permissions.canDetach) return;
    setConfirmDetach({ open: true, data: { igwId, vpcId } });
  };

  const executeDetach = async () => {
    if (!confirmDetach.data) return;
    setConfirmDetach({ open: false });
    try {
      await detachMutation.mutateAsync({
        projectId,
        region,
        igwId: confirmDetach.data.igwId,
        vpcId: confirmDetach.data.vpcId,
      });
      ToastUtils.success("Gateway detached.");
      refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to detach gateway.";
      ToastUtils.error(message);
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
    <Wrapper headerActions={headerActions}>
      <>
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

        <ConfirmDialog
          isOpen={confirmDelete.open}
          title="Delete Internet Gateway?"
          message="Delete this Internet Gateway?"
          confirmLabel="Delete"
          variant="danger"
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete({ open: false })}
        />

        <ConfirmDialog
          isOpen={confirmDetach.open}
          title="Detach Gateway?"
          message="Detach this Gateway from VPC?"
          confirmLabel="Detach"
          variant="warning"
          onConfirm={executeDetach}
          onCancel={() => setConfirmDetach({ open: false })}
        />
      </>
    </Wrapper>
  );
};

export default InternetGatewaysContainer;
export type { InternetGatewayHooks };
