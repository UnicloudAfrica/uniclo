import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeQuery, createProvisioningUpdater } from "./useRealtimeQuery";
import useAuthStore from "../stores/authStore";
import logger from "../utils/logger";

/**
 * Hook to listen for real-time tenant provisioning updates.
 *
 * Uses `useRealtimeQuery` to manage Echo channel lifecycle.
 */
export const useTenantBroadcasting = (tenantId?: string | number | null) => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  const handleEvent = useCallback(
    (event: unknown) => {
      logger.log("Real-time Tenant Update:", event);

      const updater = createProvisioningUpdater(queryClient, ["admin-tenant-details", tenantId]);
      updater(event);
    },
    [queryClient, tenantId]
  );

  useRealtimeQuery({
    channels: {
      channel: `tenants.${tenantId}`,
      event: ".TenantProvisioningUpdated",
    },
    onEvent: handleEvent,
    enabled: isAuthenticated && role === "admin" && !!tenantId,
  });

  return null;
};
