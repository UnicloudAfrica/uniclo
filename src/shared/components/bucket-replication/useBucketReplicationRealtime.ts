/**
 * Reverb subscription for bucket replication events.
 *
 * Subscribes to the AcF private channel `bucket-replication.{identifier}`
 * (server-side: `routes/channels.php` authorizes via
 * `belongsToOrganization($replication->organization_id)`).
 *
 * On any of the broadcast events listed below, invalidates the relevant
 * react-query keys so the UI refreshes immediately instead of waiting
 * for the next polling tick. Polling stays armed as a fallback — if the
 * WebSocket drops, the 5s/30s tick eventually catches state changes.
 *
 * Events the AcF backend broadcasts on this channel
 * (see api/app/Events/Replication/BucketReplicationEvent.php):
 *   - started, paused, resumed
 *   - fenced, draining, promoted (EC-38 failover)
 *   - reconcile_required (EC-35)
 *   - failed
 *   - conflict_detected (EC-54/55)
 *   - health_updated
 *   - egress_cap_reached (EC-40)
 *   - event_applied (throttled at 100 boundaries)
 *
 * Failure modes handled:
 *   - WebSocket connection refused → useAcfRealtimeEvent silently no-ops
 *     (polling still works)
 *   - Channel auth fails (cross-org access attempt) → server rejects,
 *     hook leaves the channel cleanly on unmount
 *   - Multiple subscribers to the same channel → laravel-echo dedupes
 *     internally; teardown races are caught by the hook
 *
 * Why this isn't inside useBucketHealthPolling:
 *   - Polling has a sensible default (no Echo dependency); pages that
 *     only need stale-tolerant rendering can use the polling hook alone
 *   - This realtime layer is opt-in for detail pages where < 5s freshness
 *     matters during failover (queue depth, fence ack)
 */
import { useQueryClient } from "@tanstack/react-query";
import { useAcfRealtimeEvent } from "@/hooks/useAcfRealtime";

/** Events that should trigger a full refetch — anything that mutates state. */
const STATE_CHANGING_EVENTS = [
  "started",
  "paused",
  "resumed",
  "fenced",
  "draining",
  "promoted",
  "reconcile_required",
  "failed",
  "egress_cap_reached",
] as const;

/** Events that only mutate health/queue counters — refetch only health. */
const HEALTH_ONLY_EVENTS = ["health_updated", "event_applied"] as const;

/** Events that mutate the conflict inbox — refetch conflicts. */
const CONFLICT_EVENTS = ["conflict_detected"] as const;

export interface UseBucketReplicationRealtimeOptions {
  /** Replication identifier (`brpl_*`). Pass null/undefined to disable. */
  identifier: string | null | undefined;
  /** Disable the subscription entirely (e.g. when the page is hidden). */
  enabled?: boolean;
}

/**
 * Subscribes to the bucket-replication channel and invalidates relevant
 * react-query keys on each event class.
 *
 * Query keys this hook invalidates (must match the keys used by
 * useBucketHealthPolling + the consumer page's queries):
 *   - ["acf-bucket-replication", identifier]
 *   - ["acf-bucket-replication-health", identifier]
 *   - ["acf-bucket-replication-feed", identifier]
 *   - ["acf-bucket-replication-conflicts", identifier]
 */
export function useBucketReplicationRealtime({
  identifier,
  enabled = true,
}: UseBucketReplicationRealtimeOptions): void {
  const qc = useQueryClient();
  const channel = identifier ? `bucket-replication.${identifier}` : null;

  // We register one listener per event name. laravel-echo's channel
  // object is the same instance per channelName so additional listens
  // don't create duplicate subscriptions; teardown unbinds each one.

  // State-changing events: refetch the replication record + health.
  // health refresh is critical because queue_depth + heartbeat update
  // alongside lifecycle transitions (e.g., fence → queue starts draining).
  for (const event of STATE_CHANGING_EVENTS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAcfRealtimeEvent(
      channel,
      event,
      () => {
        if (!identifier) return;
        qc.invalidateQueries({ queryKey: ["acf-bucket-replication", identifier] });
        qc.invalidateQueries({ queryKey: ["acf-bucket-replication-health", identifier] });
      },
      { enabled },
    );
  }

  // Health-only events — cheaper, fire only the health refetch.
  for (const event of HEALTH_ONLY_EVENTS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAcfRealtimeEvent(
      channel,
      event,
      () => {
        if (!identifier) return;
        qc.invalidateQueries({ queryKey: ["acf-bucket-replication-health", identifier] });
      },
      { enabled },
    );
  }

  // Conflict events — refetch the conflict inbox + feed (the conflict
  // shows up as both a feed item and an inbox row).
  for (const event of CONFLICT_EVENTS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAcfRealtimeEvent(
      channel,
      event,
      () => {
        if (!identifier) return;
        qc.invalidateQueries({ queryKey: ["acf-bucket-replication-conflicts", identifier] });
        qc.invalidateQueries({ queryKey: ["acf-bucket-replication-feed", identifier] });
      },
      { enabled },
    );
  }
}
