import React, { useState } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { SubnetsOverview } from "../index";
import CreateSubnetModal from "../modals/CreateSubnetModal";
import ModernButton from "../../ui/ModernButton";
import ConfirmDialog from "../../ui/ConfirmDialog";
import {
  getSubnetPermissions,
  type Hierarchy,
  type SubnetPermissions,
} from "@/shared/config/permissionPresets";
import type { Subnet, Vpc } from "../types";

interface SubnetHooks {
  useList: (
    projectId: string,
    region?: string,
    options?: { enabled?: boolean }
  ) => UseQueryResult<Subnet[], Error>;
  useCreate: () => UseMutationResult<
    unknown,
    Error,
    {
      projectId: string;
      region?: string;
      payload: { name: string; cidr_block: string; vpc_id: string };
    },
    unknown
  >;
  useDelete: () => UseMutationResult<
    unknown,
    Error,
    { projectId: string; region?: string; subnetId: string },
    unknown
  >;
  /** Optional - only needed for hierarchies that can create subnets */
  useVpcs?: (
    projectId: string,
    region?: string,
    options?: { enabled?: boolean }
  ) => UseQueryResult<Vpc[], Error>;
}

interface SubnetsContainerProps {
  hierarchy: Hierarchy;
  projectId: string;
  region: string;
  hooks: SubnetHooks;
  /** Optional permission override */
  permissions?: SubnetPermissions;
  /** Wrapper component that receives header actions and children */
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement;
}

/**
 * Container component for Subnets that handles:
 * - Data fetching via injected hooks (SINGLE FETCH)
 * - Permission-based action and display gating
 * - Create modal state
 * - Passes header actions to wrapper for page shell placement
 */
const SubnetsContainer: React.FC<SubnetsContainerProps> = ({
  hierarchy,
  projectId,
  region,
  hooks,
  permissions: permissionsOverride,
  wrapper: Wrapper,
}) => {
  // Derive permissions from hierarchy or use override
  const permissions = permissionsOverride ?? getSubnetPermissions(hierarchy);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; data?: Subnet }>({
    open: false,
  });

  // Use injected hooks - SINGLE SOURCE OF TRUTH
  const { data: subnets = [], isLoading, isFetching, refetch } = hooks.useList(projectId, region);
  // VPCs: use stub if hook not provided (read-only roles don't need VPCs)
  const useVpcsHook = hooks.useVpcs ?? (() => ({ data: [] }));
  const { data: vpcs = [] } = useVpcsHook(projectId, region);
  const { mutate: createSubnet, isPending: isCreating } = hooks.useCreate();
  const { mutate: deleteSubnet } = hooks.useDelete();

  // Handlers
  const handleCreate = (name: string, cidrBlock: string, vpcId: string) => {
    if (!permissions.canCreate) return;
    createSubnet(
      {
        projectId,
        region,
        payload: { name, cidr_block: cidrBlock, vpc_id: vpcId },
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          refetch();
        },
      }
    );
  };

  const handleDelete = (subnet: Subnet) => {
    if (!permissions.canDelete) return;
    if (subnet.is_default) {
      alert("Cannot delete the default subnet");
      return;
    }
    setConfirmDelete({ open: true, data: subnet });
  };

  const executeDelete = () => {
    if (!confirmDelete.data) return;
    deleteSubnet(
      { projectId, region, subnetId: confirmDelete.data.id },
      { onSuccess: () => refetch() }
    );
    setConfirmDelete({ open: false });
  };

  // Build header actions
  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        {isFetching ? "Refreshing..." : "Refresh"}
      </ModernButton>
      {permissions.canCreate && (
        <ModernButton variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Create Subnet
        </ModernButton>
      )}
    </div>
  );

  // Main content
  const content = (
    <>
      <SubnetsOverview
        subnets={subnets}
        isLoading={isLoading}
        permissions={permissions}
        onDelete={permissions.canDelete ? handleDelete : undefined}
      />

      {/* Create Modal - only if can create */}
      {permissions.canCreate && (
        <CreateSubnetModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          isCreating={isCreating}
          vpcs={vpcs}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDelete.open}
        title="Delete Subnet?"
        message="Are you sure you want to delete this subnet?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ open: false })}
      />
    </>
  );

  return <Wrapper headerActions={headerActions}>{content}</Wrapper>;
};

export default SubnetsContainer;
export type { SubnetHooks };
