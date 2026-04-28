import React, { useState } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { SecurityGroupsOverview } from "../index";
import CreateSecurityGroupModal from "../modals/CreateSecurityGroupModal";
import ModernButton from "../../ui/ModernButton";
import ConfirmDialog from "../../ui/ConfirmDialog";
import {
  getSecurityGroupPermissions,
  type Hierarchy,
  type SecurityGroupPermissions,
} from "@/shared/config/permissionPresets";
import type { SecurityGroup, Vpc } from "../types";

interface SecurityGroupHooks {
  useList: (
    projectId: string,
    region?: string,
    options?: unknown
  ) => UseQueryResult<SecurityGroup[], Error>;
  useCreate: () => UseMutationResult<
    unknown,
    Error,
    {
      projectId: string;
      region?: string;
      payload: { name: string; description?: string; vpc_id: string };
    },
    unknown
  >;
  useDelete: () => UseMutationResult<
    unknown,
    Error,
    { projectId: string; region?: string; securityGroupId: string },
    unknown
  >;
  /** Optional - only needed for Admin who can create SGs */
  useVpcs?: (projectId: string, region?: string, options?: unknown) => UseQueryResult<Vpc[], Error>;
}

interface SecurityGroupsContainerProps {
  hierarchy: Hierarchy;
  projectId: string;
  region: string;
  hooks: SecurityGroupHooks;
  /** Optional permission override */
  permissions?: SecurityGroupPermissions;
  /** Navigation function for view rules */
  onNavigateToRules: (sg: SecurityGroup) => void;
  /** Wrapper component that receives header actions and children */
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement;
}

/**
 * Container component for Security Groups that handles:
 * - Data fetching via injected hooks (SINGLE FETCH)
 * - Permission-based action gating
 * - Create modal state
 * - Passes header actions to wrapper for page shell placement
 */
const SecurityGroupsContainer: React.FC<SecurityGroupsContainerProps> = ({
  hierarchy,
  projectId,
  region,
  hooks,
  permissions: permissionsOverride,
  onNavigateToRules,
  wrapper: Wrapper,
}) => {
  // Derive permissions from hierarchy or use override
  const permissions = permissionsOverride ?? getSecurityGroupPermissions(hierarchy);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; data?: SecurityGroup }>({
    open: false,
  });

  // Use injected hooks - SINGLE SOURCE OF TRUTH
  const {
    data: securityGroups = [],
    isLoading,
    isFetching,
    refetch,
  } = hooks.useList(projectId, region);
  // VPCs: use stub if hook not provided (Tenant/Client don't need VPCs)
  const useVpcsHook = hooks.useVpcs ?? (() => ({ data: [] as Vpc[] }));
  const { data: vpcs = [] } = useVpcsHook(projectId, region);
  const { mutate: createSg, isPending: isCreating } = hooks.useCreate();
  const { mutate: deleteSg } = hooks.useDelete();

  // Handlers
  const handleCreate = (name: string, description: string, vpcId: string) => {
    if (!permissions.canCreate) return;
    createSg(
      {
        projectId,
        region,
        payload: { name, description, vpc_id: vpcId },
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          refetch();
        },
      }
    );
  };

  const handleDelete = (sg: SecurityGroup) => {
    if (!permissions.canDelete) return;
    setConfirmDelete({ open: true, data: sg });
  };

  const executeDelete = () => {
    if (!confirmDelete.data) return;
    deleteSg(
      { projectId, region, securityGroupId: confirmDelete.data.id },
      { onSuccess: () => refetch() }
    );
    setConfirmDelete({ open: false });
  };

  const handleViewRules = (sg: SecurityGroup) => {
    if (!permissions.canViewRules) return;
    onNavigateToRules(sg);
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
          Create SG
        </ModernButton>
      )}
    </div>
  );

  // Main content
  const content = (
    <>
      <SecurityGroupsOverview
        securityGroups={securityGroups}
        isLoading={isLoading}
        permissions={permissions}
        onViewRules={permissions.canViewRules ? handleViewRules : undefined}
        onDelete={permissions.canDelete ? handleDelete : undefined}
      />

      {/* Create Modal - only if can create */}
      {permissions.canCreate && (
        <CreateSecurityGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          isCreating={isCreating}
          vpcs={vpcs}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDelete.open}
        title="Delete Security Group?"
        message="Are you sure you want to delete this security group?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ open: false })}
      />
    </>
  );

  return <Wrapper headerActions={headerActions}>{content}</Wrapper>;
};

export default SecurityGroupsContainer;
export type { SecurityGroupHooks };
