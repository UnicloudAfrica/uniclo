// @ts-nocheck
import React, { useState } from "react";
import { RefreshCw, Plus } from "lucide-react";
import { getNetworkAclPermissions, type Hierarchy } from "../../../config/permissionPresets";
import { NetworkAclsOverview } from "..";
import ToastUtils from "../../../../utils/toastUtil";
import ModernButton from "../../ui/ModernButton";
import CreateNetworkAclModal from "../modals/CreateNetworkAclModal";

interface NetworkAclHooks {
  useList: (
    projectId: string,
    region?: string
  ) => { data: any[]; isLoading: boolean; refetch: () => void };
  useVpcs: (projectId: string, region?: string) => { data: any[] };
  useCreate: () => { mutate: (input: any, options?: any) => void; isPending: boolean };
  useDelete: () => { mutate: (input: any) => void };
}

interface NetworkAclsContainerProps {
  hierarchy: Hierarchy;
  projectId: string;
  region: string;
  hooks: NetworkAclHooks;
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement;
  onManageRules: (acl: any) => void;
}

const NetworkAclsContainer: React.FC<NetworkAclsContainerProps> = ({
  hierarchy,
  projectId,
  region,
  hooks,
  wrapper: Wrapper,
  onManageRules,
}) => {
  const permissions = getNetworkAclPermissions(hierarchy);

  const { data: networkAcls = [], isLoading, refetch } = hooks.useList(projectId, region);
  const { data: vpcs = [] } = hooks.useVpcs(projectId, region);
  const { mutate: createAcl, isPending: isCreating } = hooks.useCreate();
  const { mutate: deleteAcl } = hooks.useDelete();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreate = (data: { vpc_id: string; name?: string }) => {
    if (!permissions.canCreate) return;
    createAcl(
      {
        projectId,
        region,
        payload: data,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          ToastUtils.success("Network ACL created successfully.");
        },
        onError: (error: any) => {
          ToastUtils.error(error?.message || "Failed to create Network ACL.");
        },
      }
    );
  };

  const handleDelete = (acl: any) => {
    if (!permissions.canDelete) return;
    if (acl.is_default) {
      ToastUtils.error("Cannot delete the default Network ACL.");
      return;
    }
    if (confirm("Are you sure you want to delete this Network ACL?")) {
      deleteAcl({ projectId, region, networkAclId: acl.id });
    }
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="secondary" size="sm" onClick={() => refetch()} disabled={isLoading}>
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
      </ModernButton>
      {permissions.canCreate && (
        <ModernButton variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create ACL
        </ModernButton>
      )}
    </div>
  );

  return (
    <Wrapper headerActions={headerActions}>
      <NetworkAclsOverview
        networkAcls={networkAcls}
        isLoading={isLoading}
        onManageRules={onManageRules}
        onDelete={permissions.canDelete ? handleDelete : undefined}
        showActions={permissions.canManageRules || permissions.canDelete}
      />

      <CreateNetworkAclModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
        vpcs={vpcs}
        isLoading={isCreating}
      />
    </Wrapper>
  );
};

export default NetworkAclsContainer;
export type { NetworkAclHooks };
