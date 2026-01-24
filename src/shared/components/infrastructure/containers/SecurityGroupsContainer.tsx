// @ts-nocheck
import React, { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { SecurityGroupsOverview } from "../index";
import CreateSecurityGroupModal from "../modals/CreateSecurityGroupModal";
import ModernButton from "../../ui/ModernButton";
import {
  getSecurityGroupPermissions,
  type Hierarchy,
  type SecurityGroupPermissions,
} from "../../../config/permissionPresets";
import type { SecurityGroup } from "../types";

interface SecurityGroupHooks {
  useList: (
    projectId: string,
    region: string
  ) => { data: SecurityGroup[]; isLoading: boolean; refetch: () => void };
  useCreate: () => { mutate: (params: any, options?: any) => void; isPending: boolean };
  useDelete: () => { mutate: (params: any) => void };
  /** Optional - only needed for Admin who can create SGs */
  useVpcs?: (projectId: string, region: string) => { data: any[] };
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

  // Use injected hooks - SINGLE SOURCE OF TRUTH
  const { data: securityGroups = [], isLoading, refetch } = hooks.useList(projectId, region);
  // VPCs: use stub if hook not provided (Tenant/Client don't need VPCs)
  const useVpcsHook = hooks.useVpcs ?? (() => ({ data: [] }));
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
        },
      }
    );
  };

  const handleDelete = (sg: SecurityGroup) => {
    if (!permissions.canDelete) return;
    if (confirm("Are you sure you want to delete this security group?")) {
      deleteSg({ projectId, region, securityGroupId: sg.id });
    }
  };

  const handleViewRules = (sg: SecurityGroup) => {
    if (!permissions.canViewRules) return;
    onNavigateToRules(sg);
  };

  // Build header actions
  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="secondary" size="sm" onClick={refetch} disabled={isLoading}>
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
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
    </>
  );

  return <Wrapper headerActions={headerActions}>{content}</Wrapper>;
};

export default SecurityGroupsContainer;
export type { SecurityGroupHooks };
