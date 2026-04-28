import { useMemo } from "react";
import { useRealtimeQuery, type ChannelConfig } from "./useRealtimeQuery";
import { useApiContext } from "./useApiContext";

type DatabaseId = string | number;

/**
 * Real-time provisioning progress for managed databases (FR-031).
 *
 * Subscribes to `private:managed-databases.{id}` and fires `onStepUpdate`
 * whenever the backend broadcasts a progress event. The backend event is
 * `ManagedDatabaseProvisioningUpdated`, broadcast under the stable
 * channel-side name `progress.updated` so the JS client can listen for
 * `.progress.updated` regardless of server-side namespacing.
 *
 * The payload shape (from `ManagedDatabaseProvisioningUpdated::broadcastWith()`):
 * ```ts
 * {
 *   database_id: number;
 *   identifier: string;
 *   status: string;
 *   plan_kind: 'bundled' | 'management_only';
 *   step: { id: string; label: string; status: string; context?: Record<string, unknown> };
 *   progress: Array<{ id: string; label: string; status: string; updated_at: string; context?: object }>;
 *   updated_at: string;
 * }
 * ```
 *
 * Pass an array of database IDs to watch multiple rows at once (e.g. on
 * a list page); pass a single ID wrapped in an array on the detail page.
 */
export const useManagedDatabaseBroadcasting = (
  databaseIds: DatabaseId[] | null | undefined,
  onStepUpdate?: (event: unknown) => void
) => {
  const { isAuthenticated } = useApiContext();

  const channels = useMemo<ChannelConfig[]>(() => {
    if (!Array.isArray(databaseIds)) return [];
    const unique = new Set(
      databaseIds.map((id) => String(id)).filter(Boolean)
    );
    return Array.from(unique).map((id) => ({
      channel: `managed-databases.${id}`,
      event: ".progress.updated",
    }));
  }, [databaseIds]);

  useRealtimeQuery({
    channels,
    onEvent: onStepUpdate,
    enabled: isAuthenticated && channels.length > 0,
  });

  return null;
};
