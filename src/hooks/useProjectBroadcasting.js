import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import createEchoClient from "../echo";
import useAdminAuthStore from "../stores/adminAuthStore";

/**
 * Hook to listen for real-time project provisioning updates.
 * When an event is received, it updates the React Query cache immediately.
 */
export const useProjectBroadcasting = (projectId) => {
  const queryClient = useQueryClient();
  const echoRef = useRef(null);
  const { token } = useAdminAuthStore();

  useEffect(() => {
    if (!projectId || !token) return;

    // Initialize Echo
    const echo = createEchoClient();
    echoRef.current = echo;

    // Listen on the private project channel
    const channel = echo.private(`projects.${projectId}`);

    channel.listen(".ProjectProvisioningUpdated", (event) => {
      console.log("🚀 Real-time Provisioning Update:", event);

      // Update the project status query cache
      queryClient.setQueryData(["admin-project-status", projectId], (oldData) => {
        if (!oldData || !oldData.project) return oldData;

        const updatedProgress = [...(oldData.project.provisioning_progress || [])];
        const newStep = event.step;

        const stepIndex = updatedProgress.findIndex((s) => s.id === newStep.id);
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

        return {
          ...oldData,
          project: {
            ...oldData.project,
            provisioning_progress: updatedProgress,
          },
        };
      });

      // Invalidate other related queries to trigger background refreshes if needed
      if (event.step.id === "provision_vpc" || event.step.id === "create_subnets") {
        queryClient.invalidateQueries(["admin-project-network-status", projectId]);
      }
    });

    return () => {
      if (echoRef.current) {
        echoRef.current.leave(`projects.${projectId}`);
      }
    };
  }, [projectId, token, queryClient]);

  return null;
};
