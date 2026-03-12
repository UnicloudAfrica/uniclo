import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeQuery, createProvisioningUpdater } from "./useRealtimeQuery";
import useAuthStore from "../stores/authStore";
import logger from "../utils/logger";

/**
 * Hook to listen for real-time user provisioning updates.
 *
 * Uses `useRealtimeQuery` to manage Echo channel lifecycle.
 */
export const useUserBroadcasting = (userId?: string | number | null) => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  const handleEvent = useCallback(
    (event: unknown) => {
      logger.log("Real-time User Update:", event);

      const updater = createProvisioningUpdater(queryClient, ["admin-client-details", userId]);
      updater(event);
    },
    [queryClient, userId]
  );

  useRealtimeQuery({
    channels: {
      channel: `users.${userId}`,
      event: ".UserProvisioningUpdated",
    },
    onEvent: handleEvent,
    enabled: isAuthenticated && role === "admin" && !!userId,
  });

  return null;
};
