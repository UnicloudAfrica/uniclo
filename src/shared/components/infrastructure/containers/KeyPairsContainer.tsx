import React from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { getKeyPairPermissions, type Hierarchy } from "../../../config/permissionPresets";
import KeyPairsOverview from "../KeyPairsOverview";
import ToastUtils from "../../../../utils/toastUtil";

interface KeyPairHooks {
  useList: (projectId: string, region?: string, options?: any) => any;
  useDelete: () => UseMutationResult<any, any, any, unknown>;
  useSync: () => UseMutationResult<any, any, any, unknown>;
}

interface KeyPairsContainerProps {
  hierarchy: Hierarchy;
  projectId: string;
  region: string;
  hooks: KeyPairHooks;
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement<any>;
  onStatsUpdate?: (count: number) => void;
}

/**
 * Container component for Key Pairs.
 * Handles:
 * - Data fetching via hooks
 * - Permission gating
 * - Delete/Sync mutations
 */
const KeyPairsContainer: React.FC<KeyPairsContainerProps> = ({
  hierarchy,
  projectId,
  region,
  hooks,
  wrapper: Wrapper,
  onStatsUpdate,
}) => {
  const permissions = getKeyPairPermissions(hierarchy);

  // Hooks
  const { data: keyPairs = [], isFetching } = hooks.useList(projectId, region, {
    enabled: Boolean(projectId),
  });
  const { mutate: deleteKeyPair, isPending: isDeleting } = hooks.useDelete();
  const { mutateAsync: syncKeyPairs, isPending: isSyncing } = hooks.useSync();

  const handleSync = async () => {
    if (!permissions.canSync) return;
    if (!projectId) {
      ToastUtils.error("Provide a project before syncing key pairs.");
      return;
    }
    try {
      await syncKeyPairs({ project_id: projectId, region });
      ToastUtils.success("Key pairs synced successfully.");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Unable to sync key pairs.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!permissions.canDelete) return;
    return new Promise<void>((resolve, reject) => {
      deleteKeyPair(
        {
          id,
          project_id: projectId,
          region,
          payload: {
            project_id: projectId,
            region,
          },
        },
        {
          onSuccess: () => {
            ToastUtils.success(`Deleted key pair "${name}".`);
            resolve();
          },
          onError: (error: any) => {
            ToastUtils.error(error?.message || "Failed to delete key pair.");
            reject(error);
          },
        }
      );
    });
  };

  return (
    <Wrapper headerActions={null}>
      <KeyPairsOverview
        keyPairs={keyPairs}
        isLoading={isFetching}
        permissions={permissions}
        projectId={projectId}
        region={region}
        onSync={handleSync}
        onDelete={handleDelete}
        isSyncing={isSyncing}
        isDeleting={isDeleting}
        onStatsUpdate={onStatsUpdate}
      />
    </Wrapper>
  );
};

export default KeyPairsContainer;
export type { KeyPairHooks };
