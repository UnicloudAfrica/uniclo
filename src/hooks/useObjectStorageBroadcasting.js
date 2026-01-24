import { useEffect, useRef } from "react";
import createEchoClient from "../echo";
import { useApiContext } from "./useApiContext";

/**
 * Hook to listen for real-time object storage provisioning updates.
 */
export const useObjectStorageBroadcasting = (accountId, onStepUpdate) => {
  const echoRef = useRef(null);
  const { isAuthenticated } = useApiContext();

  useEffect(() => {
    if (!isAuthenticated) return;

    const accountIds = Array.isArray(accountId)
      ? accountId.filter(Boolean).map(String)
      : accountId
        ? [String(accountId)]
        : [];

    if (accountIds.length === 0) return;

    const echo = createEchoClient();
    echoRef.current = echo;

    accountIds.forEach((id) => {
      const channel = echo.private(`object-storage.${id}`);
      channel.listen(".ObjectStorageProvisioningUpdated", (event) => {
        if (typeof onStepUpdate === "function") {
          onStepUpdate({ ...event, accountId: id });
        }
      });
    });

    return () => {
      if (echoRef.current) {
        accountIds.forEach((id) => {
          echoRef.current.leave(`object-storage.${id}`);
        });
      }
    };
  }, [accountId, isAuthenticated, onStepUpdate]);

  return null;
};
