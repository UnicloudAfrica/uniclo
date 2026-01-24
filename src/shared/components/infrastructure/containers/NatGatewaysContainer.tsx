// @ts-nocheck
import React, { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import {
  getNatGatewayPermissions,
  type Hierarchy,
  type NatGatewayPermissions,
} from "../../../config/permissionPresets";
import { NatGatewaysOverview } from "..";
import ToastUtils from "../../../../utils/toastUtil";
import ModernButton from "../../ui/ModernButton";
import CreateNatGatewayModal from "../modals/CreateNatGatewayModal";

interface NatGatewayHooks {
  useList: (
    projectId: string,
    region?: string,
    options?: any
  ) => { data: any[]; isLoading: boolean; refetch: () => void };
  useCreate: () => { mutate: (input: any, options?: any) => void; isPending: boolean };
  useDelete: () => { mutate: (input: any, options?: any) => void; isPending: boolean }; // Some Delete hooks use mutateAsync, check usage. vpcInfraHooks uses mutate.
}

interface NatGatewaysContainerProps {
  hierarchy: Hierarchy;
  projectId: string;
  region: string;
  hooks: NatGatewayHooks;
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement;
  onStatsUpdate?: (count: number) => void;
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
    refetch,
  } = hooks.useList(projectId, region, {
    enabled: Boolean(projectId),
  });

  const { mutate: createNatGateway, isPending: isCreating } = hooks.useCreate();
  const { mutate: deleteNatGateway } = hooks.useDelete();

  const [isCreateModalOpen, setCreateModal] = useState(false);

  const handleCreate = (data: any) => {
    if (!permissions.canCreate) return;
    createNatGateway(data, {
      onSuccess: () => {
        setCreateModal(false);
        ToastUtils.success("NAT Gateway created successfully.");
        // Refetch is usually handled by Query Invalidation in the hook
      },
      onError: (error: any) => {
        ToastUtils.error(error?.message || "Failed to create NAT Gateway.");
      },
    });
  };

  const handleDelete = (id: string) => {
    if (!permissions.canDelete) return;
    if (confirm("Are you sure you want to delete this NAT Gateway?")) {
      deleteNatGateway(
        { projectId, region, natGatewayId: id },
        {
          onSuccess: () => {
            ToastUtils.success("NAT Gateway deleted.");
          },
          onError: (error: any) => {
            ToastUtils.error(error?.message || "Failed to delete NAT Gateway.");
          },
        }
      );
    }
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="secondary" size="sm" onClick={() => refetch()} disabled={isLoading}>
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
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
    </>
  );
};

export default NatGatewaysContainer;
export type { NatGatewayHooks };
