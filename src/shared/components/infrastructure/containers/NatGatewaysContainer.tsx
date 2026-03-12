import React, { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { getNatGatewayPermissions, type Hierarchy } from "@/shared/config/permissionPresets";
import { NatGatewaysOverview } from "..";
import ToastUtils from "@/utils/toastUtil";
import ModernButton from "../../ui/ModernButton";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";
import CreateNatGatewayModal from "../modals/CreateNatGatewayModal";
import type { NatGateway } from "../types";

interface NatGatewayHooks {
  useList: (
    projectId: string,
    region?: string,
    options?: { enabled?: boolean }
  ) => UseQueryResult<NatGateway[], Error>;
  useCreate: () => UseMutationResult<
    NatGateway,
    Error,
    {
      project_id: string;
      region: string;
      payload: {
        subnet_id: string;
        vpc_id?: string;
        elastic_ip_id?: string;
        name?: string;
      };
    },
    unknown
  >;
  useDelete: () => UseMutationResult<
    unknown,
    Error,
    { projectId: string; region?: string; natGatewayId: string },
    unknown
  >;
}

interface NatGatewaysContainerProps {
  hierarchy: Hierarchy;
  projectId: string;
  region: string;
  hooks: NatGatewayHooks;
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement<any>;
  // Hooks to fetch dependencies for passing to Overview if needed?
  // Overview needs 'availableSubnetsCount'. We can pass that from the list data or fetch it here if needed.
  // Actually, Overview takes 'availableSubnetsCount'.
  // We might need to fetch subnets here just for the count or pass a hook?
  // For now, let's assume we can fetch subnets or just pass 0 if we don't want to double fetch.
  // AdminNatGateways was fetching subnets.
}

const NatGatewaysContainer: React.FC<NatGatewaysContainerProps> = ({
  hierarchy,
  projectId,
  region,
  hooks,
  wrapper: Wrapper,
}) => {
  const permissions = getNatGatewayPermissions(hierarchy);

  const {
    data: natGateways = [],
    isLoading,
    isFetching,
    refetch,
  } = hooks.useList(projectId, region, {
    enabled: Boolean(projectId),
  });

  const { mutate: createNatGateway, isPending: isCreating } = hooks.useCreate();
  const { mutate: deleteNatGateway } = hooks.useDelete();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; data?: string }>({
    open: false,
  });

  const handleCreate = (data: {
    project_id: string;
    region: string;
    payload: {
      subnet_id: string;
      vpc_id?: string;
      elastic_ip_id?: string;
      name?: string;
    };
  }) => {
    if (!permissions.canCreate) return;
    createNatGateway(data, {
      onSuccess: () => {
        setCreateModal(false);
        ToastUtils.success("NAT Gateway created successfully.");
        refetch();
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : "Failed to create NAT Gateway.";
        ToastUtils.error(message);
      },
    });
  };

  const handleDelete = (id: string) => {
    if (!permissions.canDelete) return;
    setDeleteConfirm({ open: true, data: id });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.data) return;
    deleteNatGateway(
      { projectId, region, natGatewayId: deleteConfirm.data },
      {
        onSuccess: () => {
          ToastUtils.success("NAT Gateway deleted.");
          setDeleteConfirm({ open: false });
          refetch();
        },
        onError: (error: unknown) => {
          const message = error instanceof Error ? error.message : "Failed to delete NAT Gateway.";
          ToastUtils.error(message);
          setDeleteConfirm({ open: false });
        },
      }
    );
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        {isFetching ? "Refreshing..." : "Refresh"}
      </ModernButton>
      {permissions.canCreate && (
        <ModernButton variant="primary" size="sm" onClick={() => setCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Create NAT Gateway
        </ModernButton>
      )}
    </div>
  );

  return (
    <>
      <Wrapper headerActions={headerActions}>
        <NatGatewaysOverview
          natGateways={natGateways}
          isLoading={isLoading}
          availableSubnetsCount={0} // We'd need to fetch subnets to get this real count. Overview uses it for stats?
          onDelete={permissions.canDelete ? (gw) => handleDelete(gw.id) : undefined}
          showActions // Overview seems to check this prop
        />
      </Wrapper>

      <CreateNatGatewayModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModal(false)}
        projectId={projectId}
        region={region}
        onCreate={handleCreate}
        isLoading={isCreating}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Delete NAT Gateway"
        message="Are you sure you want to delete this NAT Gateway?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false })}
      />
    </>
  );
};

export default NatGatewaysContainer;
export type { NatGatewayHooks };
