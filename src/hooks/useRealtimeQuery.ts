/**
 * useRealtimeQuery — Connects Laravel Echo channels to React Query invalidation.
 *
 * Provides a single abstraction for all real-time broadcasting hooks:
 *   - Manages Echo connection lifecycle (connect, listen, cleanup)
 *   - Optionally triggers React Query invalidation on events
 *   - Optionally fires a callback for direct cache updates or custom logic
 *   - Supports single or multiple channel subscriptions
 *
 * Usage:
 *
 *   // Simple invalidation — refetch when event arrives:
 *   useRealtimeQuery({
 *     channels: { channel: `projects.${id}`, event: ".ProjectProvisioningUpdated" },
 *     invalidate: [projectKeys.detail(ctx, id)],
 *   });
 *
 *   // Direct cache update + invalidation:
 *   useRealtimeQuery({
 *     channels: { channel: `users.${userId}`, event: ".UserProvisioningUpdated" },
 *     onEvent: (data) => queryClient.setQueryData(key, updater),
 *     invalidate: [userKeys.detail(ctx, userId)],
 *   });
 *
 *   // Callback-only (no React Query):
 *   useRealtimeQuery({
 *     channels: ids.map(id => ({ channel: `instances.${id}`, event: ".InstanceProvisioningUpdated" })),
 *     onEvent: (data, channel) => handleUpdate(data),
 *   });
 */
import { useEffect, useRef, useMemo } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import createEchoClient from "../echo";
import useAuthStore from "../stores/authStore";
import logger from "../utils/logger";

// ─── Types ──────────────────────────────────────────────────────────

export interface ChannelConfig {
  /** Private channel name without the "private-" prefix (e.g., "projects.123") */
  channel: string;
  /** Laravel event name, dot-prefixed (e.g., ".ProjectProvisioningUpdated") */
  event: string;
}

export interface UseRealtimeQueryOptions {
  /**
   * Channel(s) to subscribe to. Accepts a single config or an array.
   * Empty/falsy channel names are automatically filtered out.
   */
  channels: ChannelConfig | ChannelConfig[];

  /**
   * Query keys to invalidate when any subscribed event fires.
   * Each key triggers `queryClient.invalidateQueries({ queryKey })`.
   */
  invalidate?: QueryKey[];

  /**
   * Callback invoked with event data when any subscribed event fires.
   * Use for direct cache updates (`queryClient.setQueryData`) or custom logic.
   *
   * @param event  — The raw event payload from the server
   * @param channel — The channel name that received the event
   */
  onEvent?: (event: unknown, channel: string) => void;

  /**
   * Whether the hook is active. Defaults to `true` when authenticated.
   * Set to `false` to temporarily disable subscriptions without unmounting.
   */
  enabled?: boolean;
}

// ─── Stable serialisation for channel configs ────────────────────────

const serializeChannels = (configs: ChannelConfig[]): string =>
  configs
    .map((c) => `${c.channel}::${c.event}`)
    .sort()
    .join("|");

// ─── Hook ────────────────────────────────────────────────────────────

export function useRealtimeQuery(options: UseRealtimeQueryOptions): void {
  const queryClient = useQueryClient();
  const echoRef = useRef<ReturnType<typeof createEchoClient> | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Stabilise the callback ref so effect doesn't re-run on every render
  const onEventRef = useRef(options.onEvent);
  onEventRef.current = options.onEvent;

  const invalidateRef = useRef(options.invalidate);
  invalidateRef.current = options.invalidate;

  // Normalise and filter channel configs
  const channelConfigs = useMemo(() => {
    const raw = Array.isArray(options.channels) ? options.channels : [options.channels];
    return raw.filter((c) => c && c.channel && c.event);
  }, [options.channels]);

  // Stable identity for the effect dependency
  const channelKey = useMemo(() => serializeChannels(channelConfigs), [channelConfigs]);

  const isEnabled = options.enabled ?? isAuthenticated;

  useEffect(() => {
    if (!isEnabled || channelConfigs.length === 0) return;

    const echo = createEchoClient();
    echoRef.current = echo;

    channelConfigs.forEach(({ channel, event }) => {
      try {
        const echoChannel = echo.private(channel);

        echoChannel.listen(event, (data: unknown) => {
          logger.log(`[realtime] ${channel} ${event}`, data);

          // 1. Fire user callback (direct cache update, custom logic, etc.)
          onEventRef.current?.(data, channel);

          // 2. Invalidate specified query keys (triggers background refetch)
          const keys = invalidateRef.current;
          if (keys?.length) {
            keys.forEach((queryKey) => {
              queryClient.invalidateQueries({ queryKey });
            });
          }
        });
      } catch (err) {
        logger.error(`[realtime] Failed to subscribe to ${channel}`, err);
      }
    });

    return () => {
      if (echoRef.current) {
        channelConfigs.forEach(({ channel }) => {
          try {
            echoRef.current!.leave(channel);
          } catch {
            // Swallow leave errors during cleanup
          }
        });
        echoRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, channelKey, queryClient]);
}

// ─── Convenience helpers ─────────────────────────────────────────────

/**
 * Creates a standard provisioning progress cache updater.
 *
 * Many broadcasting events follow the same pattern: the server sends
 * `{ step: { id, status, ... } }` and we need to upsert that step
 * into the entity's `provisioning_progress` array.
 *
 * @param queryKey — The React Query cache key to update
 * @param dataPath — Dot path to the entity within the cache (e.g., "project", "data", or null for root)
 */
export function createProvisioningUpdater(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: QueryKey,
  dataPath?: string | null
) {
  return (event: unknown) => {
    const evt = event as Record<string, unknown> | undefined;
    const newStep = evt?.step as Record<string, unknown> | undefined;
    if (!newStep?.id) return;

    queryClient.setQueryData(queryKey, (oldData: unknown) => {
      if (!oldData || typeof oldData !== "object") return oldData;
      const old = oldData as Record<string, unknown>;

      // Resolve the entity object within the cache structure
      let entity: Record<string, unknown>;
      if (dataPath && old[dataPath] && typeof old[dataPath] === "object") {
        entity = old[dataPath] as Record<string, unknown>;
      } else {
        entity = old;
      }

      // Build updated progress array
      const progress = Array.isArray(entity.provisioning_progress)
        ? [...entity.provisioning_progress]
        : [];

      const stepId = String(newStep.id);
      const idx = progress.findIndex((s: Record<string, unknown>) => String(s?.id) === stepId);

      const updatedStep = {
        ...(idx > -1 ? progress[idx] : {}),
        ...newStep,
        updated_at: new Date().toISOString(),
      };

      if (idx > -1) {
        progress[idx] = updatedStep;
      } else {
        progress.push(updatedStep);
      }

      // Return updated structure maintaining wrapper
      if (dataPath && old[dataPath]) {
        return {
          ...old,
          [dataPath]: { ...entity, provisioning_progress: progress },
        };
      }
      return { ...old, provisioning_progress: progress };
    });
  };
}

export default useRealtimeQuery;
