import { useMemo } from "react";
import { useRealtimeQuery, type ChannelConfig } from "./useRealtimeQuery";
import { useApiContext } from "./useApiContext";

type InstanceId = string | number;

/**
 * Hook to listen for real-time instance provisioning updates.
 *
 * Uses `useRealtimeQuery` to manage Echo channel lifecycle.
 * Fires the `onStepUpdate` callback when an event arrives.
 */
export const useInstanceBroadcasting = (
  instanceIds: InstanceId[] | null | undefined,
  onStepUpdate?: (event: unknown) => void
) => {
  const { isAuthenticated } = useApiContext();

  const channels = useMemo<ChannelConfig[]>(() => {
    if (!Array.isArray(instanceIds)) return [];
    const unique = new Set(instanceIds.map((id) => String(id)).filter(Boolean));
    return Array.from(unique).map((id) => ({
      channel: `instances.${id}`,
      event: ".InstanceProvisioningUpdated",
    }));
  }, [instanceIds]);

  useRealtimeQuery({
    channels,
    onEvent: onStepUpdate,
    enabled: isAuthenticated && channels.length > 0,
  });

  return null;
};
