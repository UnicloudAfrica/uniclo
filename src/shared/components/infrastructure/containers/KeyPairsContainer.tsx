import React from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { getKeyPairPermissions, type Hierarchy } from "@/shared/config/permissionPresets";
import KeyPairsOverview from "../KeyPairsOverview";
import ToastUtils from "@/utils/toastUtil";
import type { KeyPair } from "../types";

interface KeyPairHooks {
  useList: (
    projectId?: string,
    region?: string,
    options?: { enabled?: boolean }
  ) => UseQueryResult<KeyPair[], Error>;
  useDelete: () => UseMutationResult<
    unknown,
    Error,
    {
      id: string;
      project_id: string;
      region?: string;
      payload: { project_id: string; region?: string };
    },
    unknown
  >;
  useSync: () => UseMutationResult<
    unknown,
    Error,
    { project_id: string; region?: string },
    unknown
  >;
}

interface KeyPairsContainerProps {
  hierarchy: Hierarchy;
  projectId?: string;
  region?: string;
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
  const { data: keyPairs = [], isFetching } = hooks.useList(projectId, region);
  const { mutate: deleteKeyPair, isPending: isDeleting } = hooks.useDelete();
  const { mutateAsync: syncKeyPairs, isPending: isSyncing } = hooks.useSync();

  const handleSync = async () => {
    if (!permissions.canSync) return;
    if (!projectId) {
      ToastUtils.info("Select a project to sync key pairs from the cloud provider.");
      return;
    }
    try {
      await syncKeyPairs({ project_id: projectId, region });
      ToastUtils.success("Key pairs synced successfully.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to sync key pairs.";
      ToastUtils.error(message);
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
          onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : "Failed to delete key pair.";
            ToastUtils.error(message);
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
