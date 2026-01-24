// @ts-nocheck
import React, { useState } from "react";
import { Plus, RefreshCw, RefreshCcw } from "lucide-react";
import VpcsOverview from "../VpcsOverview";
import CreateVpcModal from "../modals/CreateVpcModal";
import ModernButton from "../../ui/ModernButton";
import {
  getVpcPermissions,
  type Hierarchy,
  type VpcPermissions,
} from "../../../config/permissionPresets";
import type { Vpc } from "../VpcsTable";

interface VpcHooks {
  useList: (
    projectId: string,
    region: string
  ) => { data: Vpc[]; isLoading: boolean; refetch: () => void };
  useCreate: () => {
    mutate: (params: any, options?: any) => void;
    mutateAsync: (params: any) => Promise<any>;
    isPending: boolean;
  };
  useDelete: () => {
    mutate: (params: any) => void;
    mutateAsync: (params: any) => Promise<any>;
    isPending: boolean;
  };
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

  // Use injected hooks - SINGLE SOURCE OF TRUTH
  const { data: vpcs = [], isLoading, refetch } = hooks.useList(projectId, region);
  const { mutate: createVpc, isPending: isCreating } = hooks.useCreate();
  const { mutate: deleteVpc, isPending: isDeleting } = hooks.useDelete();

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
        },
      }
    );
  };

  const handleDelete = (vpc: Vpc) => {
    if (!permissions.canDelete) return;
    if (confirm("Are you sure you want to delete this VPC? This action cannot be undone.")) {
      deleteVpc({ projectId, region, vpcId: vpc.id });
    }
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
      <ModernButton variant="secondary" size="sm" onClick={refetch} disabled={isLoading}>
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
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
        onDelete={permissions.canDelete ? handleDelete : undefined}
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
    </>
  );

  return <Wrapper headerActions={headerActions}>{content}</Wrapper>;
};

export default VpcsContainer;
export type { VpcHooks };
