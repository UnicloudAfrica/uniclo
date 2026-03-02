import { useEffect, useMemo, useRef } from "react";
import createEchoClient from "../echo";
import { useApiContext } from "./useApiContext";

type InstanceId = string | number;

/**
 * Hook to listen for real-time instance provisioning updates.
 */
export const useInstanceBroadcasting = (
  instanceIds: InstanceId[] | null | undefined,
  onStepUpdate?: (event: unknown) => void
) => {
  const echoRef = useRef<ReturnType<typeof createEchoClient> | null>(null);
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
      channel.listen(".InstanceProvisioningUpdated", (event: any) => {
        if (typeof onStepUpdate === "function") {
          onStepUpdate(event);
        }
      });
    });

    return () => {
      if (echoRef.current) {
        normalizedIds.forEach((id) => {
          (echoRef as any).current.leave(`instances.${id}`);
        });
      }
    };
  }, [isAuthenticated, normalizedIds, onStepUpdate]);

  return null;
};
