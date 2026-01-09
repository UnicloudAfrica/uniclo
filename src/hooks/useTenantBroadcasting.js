import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import createEchoClient from "../echo";
import useAdminAuthStore from "../stores/adminAuthStore";

/**
 * Hook to listen for real-time tenant provisioning updates.
 */
export const useTenantBroadcasting = (tenantId) => {
  const queryClient = useQueryClient();
  const echoRef = useRef(null);
  const { isAuthenticated, role } = useAdminAuthStore();

  useEffect(() => {
    if (!tenantId || !isAuthenticated || role !== "admin") return;

    const echo = createEchoClient();
    echoRef.current = echo;

    const channel = echo.private(`tenants.${tenantId}`);

    channel.listen(".TenantProvisioningUpdated", (event) => {
      console.log("🚀 Real-time Tenant Update:", event);

      queryClient.setQueryData(["admin-tenant-details", tenantId], (oldData) => {
        if (!oldData) return oldData;

        const updatedProgress = [...(oldData.provisioning_progress || [])];
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
          provisioning_progress: updatedProgress,
        };
      });
    });

    return () => {
      if (echoRef.current) {
        echoRef.current.leave(`tenants.${tenantId}`);
      }
    };
  }, [tenantId, isAuthenticated, role, queryClient]);

  return null;
};
