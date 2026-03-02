import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import createEchoClient from "../echo";
import { useApiContext } from "./useApiContext";
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
 */
export const useProjectBroadcasting = (projectId: string | number | null) => {
  const queryClient = useQueryClient();
  const echoRef = useRef<ReturnType<typeof createEchoClient> | null>(null);
  const { isAuthenticated, context } = useApiContext();

  useEffect(() => {
    if (!projectId || !isAuthenticated) return;

    // Initialize Echo
    const echo = createEchoClient();
    echoRef.current = echo;

    // Listen on the private project channel
    const channel = echo.private(`projects.${projectId}`);

    channel.listen(".ProjectProvisioningUpdated", (event: ProjectBroadcastEvent) => {
      logger.log("🚀 Real-time Provisioning Update:", event);

      // Determine query key based on context
      const queryKeyPrefix =
        context === "admin"
          ? "admin-project-status"
          : context === "tenant"
            ? "tenant-project-status"
            : "clientProjectStatus";

      const newStep = asRecord(event.step);
      const newStepId = String(newStep.id ?? "");

      // Update the project status query cache
      queryClient.setQueryData([queryKeyPrefix, projectId], (oldData: unknown) => {
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

      const detailsKeyPrefix = context === "admin" ? "admin-project" : "clientProject";

      // Invalidate project details to keep everything in sync
      queryClient.invalidateQueries({ queryKey: [detailsKeyPrefix, projectId] });

      // Invalidate other related queries to trigger background refreshes if needed
      if (newStepId === "provision_vpc" || newStepId === "create_subnets") {
        const networkQueryKey =
          context === "admin"
            ? "admin-project-network-status"
            : context === "tenant"
              ? "tenant-project-network-status"
              : "client-project-network-status";
        queryClient.invalidateQueries({ queryKey: [networkQueryKey, projectId] });
      }
    });

    return () => {
      if (echoRef.current) {
        echoRef.current.leave(`projects.${projectId}`);
      }
    };
  }, [projectId, isAuthenticated, context, queryClient]);

  return null;
};
