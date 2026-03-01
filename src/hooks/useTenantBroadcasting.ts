import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import createEchoClient from "../echo";
import useAdminAuthStore from "../stores/adminAuthStore";

/**
 * Hook to listen for real-time tenant provisioning updates.
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

export const useTenantBroadcasting = (tenantId?: string | number | null) => {
  const queryClient = useQueryClient();
  const echoRef = useRef<EchoClient | null>(null);
  const { isAuthenticated, role } = useAdminAuthStore();

  useEffect(() => {
    if (!tenantId || !isAuthenticated || role !== "admin") return;

    const echo = createEchoClient();
    echoRef.current = echo;

    const channel = echo.private(`tenants.${tenantId}`);

    channel.listen(".TenantProvisioningUpdated", (event: ProvisioningEvent) => {
      console.log("🚀 Real-time Tenant Update:", event);

      queryClient.setQueryData<ProvisioningPayload>(
        ["admin-tenant-details", tenantId],
        (oldData: ProvisioningPayload | undefined) => {
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
        }
      );
    });

    return () => {
      if (echoRef.current) {
        echoRef.current.leave(`tenants.${tenantId}`);
      }
    };
  }, [tenantId, isAuthenticated, role, queryClient]);

  return null;
};
