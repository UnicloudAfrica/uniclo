import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import createEchoClient from "../echo";
import useAdminAuthStore from "../stores/adminAuthStore";
import logger from "../utils/logger";

/**
 * Hook to listen for real-time user provisioning updates.
 */
type EchoClient = ReturnType<typeof createEchoClient>;

type ProvisioningStep = {
  id?: string | number;
  [key: string]: unknown;
};

type ProvisioningEvent = {
  step?: ProvisioningStep;
};

type ProvisioningPayload = {
  provisioning_progress?: ProvisioningStep[];
  [key: string]: unknown;
};

export const useUserBroadcasting = (userId?: string | number | null) => {
  const queryClient = useQueryClient();
  const echoRef = useRef<EchoClient | null>(null);
  const { isAuthenticated, role } = useAdminAuthStore();

  useEffect(() => {
    if (!userId || !isAuthenticated || role !== "admin") return;

    const echo = createEchoClient();
    echoRef.current = echo;

    const channel = echo.private(`users.${userId}`);

    channel.listen(".UserProvisioningUpdated", (event: ProvisioningEvent) => {
      logger.log("🚀 Real-time User Update:", event);

      queryClient.setQueryData<ProvisioningPayload>(["admin-client-details", userId], (oldData) => {
        if (!oldData) return oldData;

        const updatedProgress = Array.isArray(oldData.provisioning_progress)
          ? [...oldData.provisioning_progress]
          : [];
        const newStep = event.step;

        if (!newStep?.id) {
          return oldData;
        }

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
          provisioning_progress: updatedProgress,
        };
      });
    });

    return () => {
      if (echoRef.current) {
        echoRef.current.leave(`users.${userId}`);
      }
    };
  }, [userId, isAuthenticated, role, queryClient]);

  return null;
};
