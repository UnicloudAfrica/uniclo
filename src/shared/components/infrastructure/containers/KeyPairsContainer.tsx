import React, { useState } from "react";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { getKeyPairPermissions, type Hierarchy } from "@/shared/config/permissionPresets";
import KeyPairsOverview from "../KeyPairsOverview";
import ToastUtils from "@/utils/toastUtil";
import type { KeyPair } from "../types";

/**
 * Parse backend error responses into user-friendly messages.
 */
const parseCloudError = (error: unknown): string => {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred.";

  // driver_not_found — provider credentials not configured
  if (raw.includes("driver_not_found") || raw.includes("No driver bound")) {
    return "The cloud provider for this region is not configured yet. Please contact your administrator to set up provider credentials.";
  }

  // Project not provisioned
  if (raw.includes("not provisioned") || raw.includes("not provisioned yet")) {
    return "This project has not been provisioned on the cloud provider yet. Please provision the project first from Project Settings.";
  }

  // No project mapping
  if (raw.includes("no Nobus project mapping") || raw.includes("no project mapping")) {
    return "This project is not linked to a cloud provider project. Please provision or link the project first.";
  }

  return raw;
};

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
  hideResourceHeader?: boolean;
}

/**
 * Container component for Key Pairs.
 * Handles:
 * - Data fetching via hooks
 * - Permission gating
 * - Delete/Sync mutations
 *
 * When `hideResourceHeader` is true, the ResourceSection wrapper inside
 * KeyPairsOverview is skipped and action buttons are hoisted to the page shell.
 */
const KeyPairsContainer: React.FC<KeyPairsContainerProps> = ({
  hierarchy,
  projectId,
  region,
  hooks,
  wrapper: Wrapper,
  onStatsUpdate,
  hideResourceHeader = false,
}) => {
  const permissions = getKeyPairPermissions(hierarchy);
  const [headerActions, setHeaderActions] = useState<React.ReactNode>(null);

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
      ToastUtils.error(parseCloudError(error));
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
            ToastUtils.error(parseCloudError(error));
            reject(error);
          },
        }
      );
    });
  };

  const handleHeaderActionsReady = (actions: React.ReactNode[]) => {
    setHeaderActions(
      <div className="flex items-center gap-2">{actions}</div>
    );
  };

  return (
    <Wrapper headerActions={hideResourceHeader ? headerActions : null}>
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
        hideHeader={hideResourceHeader}
        onHeaderActionsReady={hideResourceHeader ? handleHeaderActionsReady : undefined}
      />
    </Wrapper>
  );
};

export default KeyPairsContainer;
export type { KeyPairHooks };
