import { useEffect, useRef } from "react";
import createEchoClient from "../echo";
import { useApiContext } from "./useApiContext";

/**
 * Hook to listen for real-time object storage provisioning updates.
 */
type EchoClient = ReturnType<typeof createEchoClient>;

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

export const useObjectStorageBroadcasting = (
  accountId?: AccountIdInput | AccountIdList,
  onStepUpdate?: (event: ProvisioningUpdate) => void
) => {
  const echoRef = useRef<EchoClient | null>(null);
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
      channel.listen(".ObjectStorageProvisioningUpdated", (event: ProvisioningEvent) => {
        onStepUpdate?.({ ...event, accountId: id });
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
