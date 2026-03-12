import React, { useState } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { ElasticIpsOverview } from "../index";
import AssociateElasticIpModal from "../modals/AssociateElasticIpModal";
import ModernButton from "../../ui/ModernButton";
import ConfirmDialog from "../../ui/ConfirmDialog";
import {
  getElasticIpPermissions,
  type Hierarchy,
  type ElasticIpPermissions,
} from "@/shared/config/permissionPresets";
import type { ElasticIp } from "../types";

interface ElasticIpHooks {
  useList: (
    projectId: string,
    region?: string,
    options?: { enabled?: boolean }
  ) => UseQueryResult<ElasticIp[], Error>;
  useCreate: () => UseMutationResult<any, Error, { projectId: string; region?: string }, unknown>;
  useDelete: () => UseMutationResult<
    any,
    Error,
    { projectId: string; region?: string; elasticIpId: string },
    unknown
  >;
  useAssociate: () => UseMutationResult<
    any,
    Error,
    { projectId: string; region?: string; elasticIpId: string; payload: { instance_id: string } },
    unknown
  >;
  useDisassociate: () => UseMutationResult<
    any,
    Error,
    { projectId: string; region?: string; elasticIpId: string },
    unknown
  >;
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
  }) => React.ReactElement<any>;
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
  const [confirmRelease, setConfirmRelease] = useState<{ open: boolean; data?: ElasticIp }>({
    open: false,
  });
  const [confirmDisassociate, setConfirmDisassociate] = useState<{
    open: boolean;
    data?: ElasticIp;
  }>({ open: false });

  // Use injected hooks - SINGLE SOURCE OF TRUTH (no hooks in dashboard pages)
  const {
    data: elasticIps = [],
    isLoading,
    isFetching,
    refetch,
  } = hooks.useList(projectId, region);
  const { mutate: createElasticIp, isPending: isCreating } = hooks.useCreate();
  const { mutate: deleteElasticIp } = hooks.useDelete();
  const { mutate: associateElasticIp, isPending: isAssociating } = hooks.useAssociate();
  const { mutate: disassociateElasticIp } = hooks.useDisassociate();

  // Handlers
  const handleAllocate = () => {
    if (!permissions.canCreate) return;
    createElasticIp({ projectId, region }, { onSuccess: () => refetch() });
  };

  const handleRelease = (elasticIp: ElasticIp) => {
    if (!permissions.canDelete) return;
    setConfirmRelease({ open: true, data: elasticIp });
  };

  const executeRelease = () => {
    if (!confirmRelease.data) return;
    deleteElasticIp(
      { projectId, region, elasticIpId: confirmRelease.data.id },
      { onSuccess: () => refetch() }
    );
    setConfirmRelease({ open: false });
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
          refetch();
        },
      }
    );
  };

  const handleDisassociate = (eip: ElasticIp) => {
    if (!permissions.canDisassociate) return;
    setConfirmDisassociate({ open: true, data: eip });
  };

  const executeDisassociate = () => {
    if (!confirmDisassociate.data) return;
    disassociateElasticIp(
      { projectId, region, elasticIpId: confirmDisassociate.data.id },
      { onSuccess: () => refetch() }
    );
    setConfirmDisassociate({ open: false });
  };

  const openAssociateModal = (eip: ElasticIp) => {
    setSelectedEip(eip);
    setShowAssociateModal(true);
  };

  // Build header actions
  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        {isFetching ? "Refreshing..." : "Refresh"}
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

      <ConfirmDialog
        isOpen={confirmRelease.open}
        title="Release Elastic IP?"
        message="Are you sure you want to release this Elastic IP?"
        confirmLabel="Release"
        variant="danger"
        onConfirm={executeRelease}
        onCancel={() => setConfirmRelease({ open: false })}
      />

      <ConfirmDialog
        isOpen={confirmDisassociate.open}
        title="Disassociate Elastic IP?"
        message="Are you sure you want to disassociate this Elastic IP?"
        confirmLabel="Disassociate"
        variant="warning"
        onConfirm={executeDisassociate}
        onCancel={() => setConfirmDisassociate({ open: false })}
      />
    </>
  );

  return <Wrapper headerActions={headerActions}>{content}</Wrapper>;
};

export default ElasticIpsContainer;
export type { HeaderActionsState, ElasticIpHooks };
