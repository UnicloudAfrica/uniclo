import React, { useState } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { Plus, RefreshCw, RefreshCcw } from "lucide-react";
import VpcsOverview from "../VpcsOverview";
import CreateVpcModal from "../modals/CreateVpcModal";
import ModernButton from "../../ui/ModernButton";
import ConfirmDialog from "../../ui/ConfirmDialog";
import {
  getVpcPermissions,
  type Hierarchy,
  type VpcPermissions,
} from "@/shared/config/permissionPresets";
import { Vpc } from "../types";

interface VpcHooks {
  useList: (projectId: string, region?: string, options?: unknown) => UseQueryResult<Vpc[], Error>;
  useCreate: () => UseMutationResult<
    unknown,
    Error,
    {
      projectId: string;
      region?: string;
      payload: { name: string; cidr: string; is_default?: boolean };
    },
    unknown
  >;
  useDelete: () => UseMutationResult<
    unknown,
    Error,
    { projectId: string; region?: string; vpcId: string },
    unknown
  >;
  /** Optional sync function - only for Client dashboard */
  onSync?: () => Promise<void>;
}

interface VpcsContainerProps {
  hierarchy: Hierarchy;
  projectId: string;
  region: string;
  hooks: VpcHooks;
  /** Optional permission override */
  permissions?: VpcPermissions;
  /** Wrapper component that receives header actions and children */
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement;
}

/**
 * Container component for VPCs that handles:
 * - Data fetching via injected hooks (SINGLE FETCH)
 * - Permission-based action gating
 * - Create modal state
 * - Sync functionality (Client only)
 * - Passes header actions to wrapper for page shell placement
 */
const VpcsContainer: React.FC<VpcsContainerProps> = ({
  hierarchy,
  projectId,
  region,
  hooks,
  permissions: permissionsOverride,
  wrapper: Wrapper,
}) => {
  // Derive permissions from hierarchy or use override
  const permissions = permissionsOverride ?? getVpcPermissions(hierarchy);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; data?: Vpc }>({
    open: false,
  });

  // Use injected hooks - SINGLE SOURCE OF TRUTH
  const { data: vpcs = [], isLoading, isFetching, refetch } = hooks.useList(projectId, region);
  const { mutate: createVpc, isPending: isCreating } = hooks.useCreate();
  const { mutate: deleteVpc } = hooks.useDelete();

  // Handlers
  const handleCreate = (name: string, cidr: string, isDefault: boolean) => {
    if (!permissions.canCreate) return;
    createVpc(
      {
        projectId,
        region,
        payload: { name, cidr, is_default: isDefault },
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          refetch();
        },
      }
    );
  };

  const handleDelete = (vpc: Vpc) => {
    if (!permissions.canDelete) return;
    setConfirmDelete({ open: true, data: vpc });
  };

  const executeDelete = () => {
    if (!confirmDelete.data) return;
    deleteVpc({ projectId, region, vpcId: confirmDelete.data.id }, { onSuccess: () => refetch() });
    setConfirmDelete({ open: false });
  };

  const handleSync = async () => {
    if (!permissions.canSync || !hooks.onSync) return;
    setIsSyncing(true);
    try {
      await hooks.onSync();
      refetch();
    } finally {
      setIsSyncing(false);
    }
  };

  // Build header actions
  const headerActions = (
    <div className="flex items-center gap-3">
      {permissions.canSync && hooks.onSync && (
        <ModernButton variant="secondary" size="sm" onClick={handleSync} disabled={isSyncing}>
          <RefreshCcw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync VPCs"}
        </ModernButton>
      )}
      <ModernButton variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        {isFetching ? "Refreshing..." : "Refresh"}
      </ModernButton>
      {permissions.canCreate && (
        <ModernButton variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Create VPC
        </ModernButton>
      )}
    </div>
  );

  // Main content
  const content = (
    <>
      <VpcsOverview
        vpcs={vpcs}
        isLoading={isLoading}
        permissions={permissions}
        onDelete={permissions.canDelete ? (vpc) => handleDelete(vpc) : undefined}
      />

      {/* Create Modal - only if can create */}
      {permissions.canCreate && (
        <CreateVpcModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          isCreating={isCreating}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDelete.open}
        title="Delete VPC?"
        message="Are you sure you want to delete this VPC? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ open: false })}
      />
    </>
  );

  return <Wrapper headerActions={headerActions}>{content}</Wrapper>;
};

export default VpcsContainer;
export type { VpcHooks };
