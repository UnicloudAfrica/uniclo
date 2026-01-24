// @ts-nocheck
import React, { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { ElasticIpsOverview } from "../index";
import AssociateElasticIpModal from "../modals/AssociateElasticIpModal";
import ModernButton from "../../ui/ModernButton";
import {
  getElasticIpPermissions,
  type Hierarchy,
  type ElasticIpPermissions,
} from "../../../config/permissionPresets";
import type { ElasticIp } from "../types";

interface ElasticIpHooks {
  useList: (
    projectId: string,
    region: string
  ) => { data: ElasticIp[]; isLoading: boolean; refetch: () => void };
  useCreate: () => { mutate: (params: any) => void; isPending: boolean };
  useDelete: () => { mutate: (params: any) => void };
  useAssociate: () => { mutate: (params: any, options?: any) => void; isPending: boolean };
  useDisassociate: () => { mutate: (params: any) => void };
}

interface HeaderActionsState {
  permissions: ElasticIpPermissions;
  isLoading: boolean;
  isCreating: boolean;
  onRefresh: () => void;
  onAllocate: () => void;
}

interface ElasticIpsContainerProps {
  hierarchy: Hierarchy;
  projectId: string;
  region: string;
  hooks: ElasticIpHooks;
  /** Optional permission override - if not provided, derived from hierarchy */
  permissions?: ElasticIpPermissions;
  /** Wrapper component that receives header actions and children */
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement;
}

/**
 * Container component for Elastic IPs that handles:
 * - Data fetching via injected hooks (SINGLE FETCH)
 * - Permission-based action gating
 * - Associate modal state
 * - Passes header actions to wrapper for page shell placement
 */
const ElasticIpsContainer: React.FC<ElasticIpsContainerProps> = ({
  hierarchy,
  projectId,
  region,
  hooks,
  permissions: permissionsOverride,
  wrapper: Wrapper,
}) => {
  // Derive permissions from hierarchy or use override
  const permissions = permissionsOverride ?? getElasticIpPermissions(hierarchy);

  // Modal state
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [selectedEip, setSelectedEip] = useState<ElasticIp | null>(null);

  // Use injected hooks - SINGLE SOURCE OF TRUTH (no hooks in dashboard pages)
  const { data: elasticIps = [], isLoading, refetch } = hooks.useList(projectId, region);
  const { mutate: createElasticIp, isPending: isCreating } = hooks.useCreate();
  const { mutate: deleteElasticIp } = hooks.useDelete();
  const { mutate: associateElasticIp, isPending: isAssociating } = hooks.useAssociate();
  const { mutate: disassociateElasticIp } = hooks.useDisassociate();

  // Handlers
  const handleAllocate = () => {
    if (!permissions.canCreate) return;
    createElasticIp({ projectId, region });
  };

  const handleRelease = (elasticIp: ElasticIp) => {
    if (!permissions.canDelete) return;
    if (confirm("Are you sure you want to release this Elastic IP?")) {
      deleteElasticIp({ projectId, region, elasticIpId: elasticIp.id });
    }
  };

  const handleAssociate = (elasticIpId: string, instanceId: string) => {
    if (!permissions.canAssociate) return;
    associateElasticIp(
      {
        projectId,
        region,
        elasticIpId,
        payload: { instance_id: instanceId },
      },
      {
        onSuccess: () => {
          setShowAssociateModal(false);
          setSelectedEip(null);
        },
      }
    );
  };

  const handleDisassociate = (eip: ElasticIp) => {
    if (!permissions.canDisassociate) return;
    if (confirm("Are you sure you want to disassociate this Elastic IP?")) {
      disassociateElasticIp({ projectId, region, elasticIpId: eip.id });
    }
  };

  const openAssociateModal = (eip: ElasticIp) => {
    setSelectedEip(eip);
    setShowAssociateModal(true);
  };

  // Build header actions
  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="secondary" size="sm" onClick={refetch} disabled={isLoading}>
        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
      </ModernButton>
      {permissions.canCreate && (
        <ModernButton variant="primary" size="sm" onClick={handleAllocate} disabled={isCreating}>
          {isCreating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Allocating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Allocate New IP
            </>
          )}
        </ModernButton>
      )}
    </div>
  );

  // Main content
  const content = (
    <>
      <ElasticIpsOverview
        elasticIps={elasticIps}
        isLoading={isLoading}
        permissions={permissions}
        onAssociate={permissions.canAssociate ? openAssociateModal : undefined}
        onDisassociate={permissions.canDisassociate ? handleDisassociate : undefined}
        onRelease={permissions.canDelete ? handleRelease : undefined}
      />

      {/* Associate Modal */}
      {selectedEip && (
        <AssociateElasticIpModal
          elasticIp={selectedEip}
          isOpen={showAssociateModal}
          onClose={() => {
            setShowAssociateModal(false);
            setSelectedEip(null);
          }}
          onAssociate={handleAssociate}
          isAssociating={isAssociating}
        />
      )}
    </>
  );

  return <Wrapper headerActions={headerActions}>{content}</Wrapper>;
};

export default ElasticIpsContainer;
export type { HeaderActionsState, ElasticIpHooks };
