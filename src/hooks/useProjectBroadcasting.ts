import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeQuery } from "./useRealtimeQuery";
import { useApiContext } from "./useApiContext";
import { projectExtendedKeys, projectKeys } from "../shared/hooks/resources/projectHooks";
import logger from "../utils/logger";

type ProjectBroadcastEvent = {
  step?: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

/**
 * Hook to listen for real-time project provisioning updates.
 * When an event is received, it updates the React Query cache immediately.
 *
 * Uses `useRealtimeQuery` to manage Echo channel lifecycle.
 */
export const useProjectBroadcasting = (projectId: string | number | null) => {
  const queryClient = useQueryClient();
  const { isAuthenticated, context } = useApiContext();

  const handleEvent = useCallback(
    (event: unknown) => {
      if (!projectId) return;

      const evt = event as ProjectBroadcastEvent;
      logger.log("Real-time Provisioning Update:", evt);

      const statusKey = projectExtendedKeys.status(context, projectId);
      const newStep = asRecord(evt.step);
      const newStepId = String(newStep.id ?? "");

      // Update the project status query cache
      queryClient.setQueryData(statusKey, (oldData: unknown) => {
        if (!oldData || !isRecord(oldData)) return oldData;
        const oldRecord = asRecord(oldData);

        // Handle different data structures between admin/client
        const project = asRecord(oldRecord.project ?? oldRecord.data ?? oldRecord);
        if (Object.keys(project).length === 0) return oldData;

        const progress = Array.isArray(project.provisioning_progress)
          ? project.provisioning_progress
          : [];
        const updatedProgress = [...progress];
        if (!newStepId) return oldData;

        const stepIndex = updatedProgress.findIndex((step) => asRecord(step).id === newStepId);
        if (stepIndex > -1) {
          updatedProgress[stepIndex] = {
            ...updatedProgress[stepIndex],
            ...newStep,
            updated_at: new Date().toISOString(),
          };
        } else {
          updatedProgress.push({
            ...newStep,
            updated_at: new Date().toISOString(),
          });
        }

        // Return updated structure maintaining the original wrapper
        if (oldRecord.project) {
          return {
            ...oldRecord,
            project: { ...asRecord(oldRecord.project), provisioning_progress: updatedProgress },
          };
        } else if (oldRecord.data) {
          return {
            ...oldRecord,
            data: { ...asRecord(oldRecord.data), provisioning_progress: updatedProgress },
          };
        }
        return { ...oldRecord, provisioning_progress: updatedProgress };
      });

      // Invalidate project details to keep everything in sync
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(context, projectId),
      });

      // Invalidate network queries for network-related steps
      if (newStepId === "provision_vpc" || newStepId === "create_subnets") {
        queryClient.invalidateQueries({
          queryKey: projectExtendedKeys.networkStatus(context, projectId),
        });
      }
    },
    [projectId, context, queryClient]
  );

  useRealtimeQuery({
    channels: {
      channel: `projects.${projectId}`,
      event: ".ProjectProvisioningUpdated",
    },
    onEvent: handleEvent,
    enabled: isAuthenticated && !!projectId,
  });

  return null;
};
