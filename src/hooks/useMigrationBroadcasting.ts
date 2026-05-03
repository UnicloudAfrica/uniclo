import { useMemo } from "react";
import { useRealtimeQuery, type ChannelConfig } from "./useRealtimeQuery";
import { useApiContext } from "./useApiContext";

/**
 * Real-time subscription for ProviderMigration status changes.
 *
 * Pairs with the backend `MigrationStatusChanged` broadcast event. Two
 * channel shapes are supported, mirroring the routes/channels.php
 * authorisation rules:
 *
 *   - `migrations.{tenantId}` — tenant-wide feed (every migration the
 *     tenant owns). Use on the migrations list page.
 *   - `provider-migration.{identifier}` — single-migration feed. Use
 *     on the migration detail page.
 *
 * The hook returns nothing — pass an `onUpdate` callback to mutate
 * React Query cache directly (no extra fetch needed) and/or pass
 * `invalidate` keys for the simpler "refetch on update" model.
 *
 * Usage (tenant-wide):
 *   useMigrationBroadcasting({
 *     tenantId,
 *     onUpdate: (event) => qc.setQueryData(key, updater),
 *   });
 *
 * Usage (single migration):
 *   useMigrationBroadcasting({
 *     migrationIdentifier: id,
 *     invalidate: [["provider-migration", id]],
 *   });
 */
export interface MigrationStatusEvent {
  identifier: string;
  previous_status: string;
  status: string;
  progress: { stage?: string; percent?: number } | null;
  resource_summary: Record<string, number> | null;
  error_message: string | null;
  completed_at: string | null;
}

interface UseMigrationBroadcastingOptions {
  tenantId?: string | number | null;
  migrationIdentifier?: string | null;
  onUpdate?: (event: MigrationStatusEvent, channel: string) => void;
  invalidate?: unknown[][];
  enabled?: boolean;
}

export function useMigrationBroadcasting({
  tenantId,
  migrationIdentifier,
  onUpdate,
  invalidate,
  enabled = true,
}: UseMigrationBroadcastingOptions): null {
  const { isAuthenticated } = useApiContext();

  const channels = useMemo<ChannelConfig[]>(() => {
    const result: ChannelConfig[] = [];
    if (tenantId) {
      result.push({
        channel: `migrations.${tenantId}`,
        event: ".migration.status_changed",
      });
    }
    if (migrationIdentifier) {
      result.push({
        channel: `provider-migration.${migrationIdentifier}`,
        event: ".migration.status_changed",
      });
    }
    return result;
  }, [tenantId, migrationIdentifier]);

  useRealtimeQuery({
    channels,
    onEvent: onUpdate as ((event: unknown, channel: string) => void) | undefined,
    invalidate,
    enabled: enabled && isAuthenticated && channels.length > 0,
  });

  return null;
}
