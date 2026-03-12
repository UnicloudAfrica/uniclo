import { useMemo, useCallback } from "react";
import { useRealtimeQuery, type ChannelConfig } from "./useRealtimeQuery";
import { useApiContext } from "./useApiContext";

type AccountId = string | number;
type AccountIdInput = AccountId | null | undefined;
type AccountIdList = AccountIdInput[];

type ProvisioningStep = {
  id?: string | number;
  [key: string]: unknown;
};

type ProvisioningEvent = {
  step?: ProvisioningStep;
  [key: string]: unknown;
};

type ProvisioningUpdate = ProvisioningEvent & {
  accountId?: string;
};

/**
 * Hook to listen for real-time object storage provisioning updates.
 *
 * Uses `useRealtimeQuery` to manage Echo channel lifecycle.
 */
export const useObjectStorageBroadcasting = (
  accountId?: AccountIdInput | AccountIdList,
  onStepUpdate?: (event: ProvisioningUpdate) => void
) => {
  const { isAuthenticated } = useApiContext();

  const channels = useMemo<ChannelConfig[]>(() => {
    const ids = Array.isArray(accountId)
      ? accountId.filter(Boolean).map(String)
      : accountId
        ? [String(accountId)]
        : [];

    return ids.map((id) => ({
      channel: `object-storage.${id}`,
      event: ".ObjectStorageProvisioningUpdated",
    }));
  }, [accountId]);

  // Wrap onStepUpdate to include accountId in the event
  const handleEvent = useCallback(
    (event: unknown, channel: string) => {
      // Extract account ID from channel name: "object-storage.123" -> "123"
      const id = channel.replace("object-storage.", "");
      onStepUpdate?.({ ...(event as ProvisioningEvent), accountId: id });
    },
    [onStepUpdate]
  );

  useRealtimeQuery({
    channels,
    onEvent: handleEvent,
    enabled: isAuthenticated && channels.length > 0,
  });

  return null;
};
