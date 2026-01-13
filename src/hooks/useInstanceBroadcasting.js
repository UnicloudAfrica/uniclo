import { useEffect, useMemo, useRef } from "react";
import createEchoClient from "../echo";
import { useApiContext } from "./useApiContext";

/**
 * Hook to listen for real-time instance provisioning updates.
 */
export const useInstanceBroadcasting = (instanceIds, onStepUpdate) => {
  const echoRef = useRef(null);
  const { isAuthenticated } = useApiContext();

  const normalizedIds = useMemo(() => {
    if (!Array.isArray(instanceIds)) return [];
    const unique = new Set(instanceIds.map((id) => String(id)).filter(Boolean));
    return Array.from(unique);
  }, [instanceIds]);

  useEffect(() => {
    if (!isAuthenticated || normalizedIds.length === 0) return;

    const echo = createEchoClient();
    echoRef.current = echo;

    normalizedIds.forEach((id) => {
      const channel = echo.private(`instances.${id}`);
      channel.listen(".InstanceProvisioningUpdated", (event) => {
        if (typeof onStepUpdate === "function") {
          onStepUpdate(event);
        }
      });
    });

    return () => {
      if (echoRef.current) {
        normalizedIds.forEach((id) => {
          echoRef.current.leave(`instances.${id}`);
        });
      }
    };
  }, [isAuthenticated, normalizedIds, onStepUpdate]);

  return null;
};
