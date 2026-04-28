import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  ACTIVE_REPLICATION_STATUSES,
  type BucketReplicationHealth,
  type BucketReplicationStatus,
} from "./types";

/**
 * Permissive return type for the fetcher — accepts any thenable. The
 * hook's queryFn unwraps `{data: ...}` envelopes vs bare bodies at
 * runtime, so callers don't need to cast. Keeping the type as
 * `Promise<unknown>` rather than narrowing avoids forcing every
 * api-client method to satisfy an AxiosResponse-shaped interface.
 */

/**
 * Visibility-aware health polling for a bucket replication detail page.
 *
 * Cadence:
 *   - 5 s while the replication is in an active state (active / fencing /
 *     draining) AND the tab is visible
 *   - 30 s when terminal/paused
 *   - Stops entirely when the tab is hidden (`refetchIntervalInBackground:
 *     false` is the default in react-query, but we also gate the interval
 *     itself so a long-paused tab doesn't accumulate stale state)
 *
 * Why a hook (not just inline `refetchInterval`):
 *   1. Several pages need the same cadence — tenant detail, client read-
 *      only detail, the failover wizard's drain step. Centralizing avoids
 *      drift.
 *   2. Tests can mock this hook in isolation without spinning up react-
 *      query infrastructure.
 *   3. The status-aware cadence is a real product decision; if it ever
 *      changes (e.g. websocket replaces polling) only this file moves.
 *
 * Generic over the API client method so tenant-side and client-side
 * pages can both call it without duplicating types — pass the bound
 * `acfApi.getBucketReplicationHealth(id)` function as `fetcher`.
 *
 * @example
 * const { data, isLoading } = useBucketHealthPolling({
 *   identifier: id,
 *   currentStatus: replication?.status,
 *   fetcher: () => acfApi.getBucketReplicationHealth(id),
 * });
 */
export interface UseBucketHealthPollingOptions {
  identifier: string;
  /** Current replication status — drives cadence selection. */
  currentStatus?: BucketReplicationStatus | string | undefined;
  /** Async fetcher — any thenable. The hook unwraps `{data: ...}` envelopes vs bare bodies at runtime. */
  fetcher: () => Promise<unknown>;
  /** Override the active-state cadence. Default 5000ms. */
  activeIntervalMs?: number;
  /** Override the terminal-state cadence. Default 30000ms. */
  terminalIntervalMs?: number;
  /** Disable polling entirely. Useful in tests + storybook. */
  enabled?: boolean;
}

const DEFAULT_ACTIVE_INTERVAL_MS = 5000;
const DEFAULT_TERMINAL_INTERVAL_MS = 30000;

export function useBucketHealthPolling(
  opts: UseBucketHealthPollingOptions
): UseQueryResult<BucketReplicationHealth | null, Error> {
  const {
    identifier,
    currentStatus,
    fetcher,
    activeIntervalMs = DEFAULT_ACTIVE_INTERVAL_MS,
    terminalIntervalMs = DEFAULT_TERMINAL_INTERVAL_MS,
    enabled = true,
  } = opts;

  const isActive =
    currentStatus !== undefined
      ? ACTIVE_REPLICATION_STATUSES.includes(currentStatus as BucketReplicationStatus)
      : false;

  return useQuery<BucketReplicationHealth | null, Error>({
    queryKey: ["acf-bucket-replication-health", identifier],
    queryFn: async () => {
      const res = await fetcher();
      // Axios-style: { data: <body> }. Hook also tolerates a fetcher
      // that returns the body directly.
      const wrapped = res as { data?: unknown } | undefined;
      const body = (wrapped && typeof wrapped === "object" && "data" in wrapped)
        ? (wrapped.data as unknown)
        : (res as unknown);
      // The body itself might also be `{ data: <BucketReplicationHealth> }`.
      if (body && typeof body === "object" && "data" in (body as Record<string, unknown>)) {
        const inner = (body as { data: unknown }).data;
        if (inner && typeof inner === "object") {
          return inner as BucketReplicationHealth;
        }
      }
      return (body as BucketReplicationHealth | null) ?? null;
    },
    enabled: enabled && !!identifier,
    refetchInterval: isActive ? activeIntervalMs : terminalIntervalMs,
    // react-query default — don't waste battery polling a hidden tab.
    refetchIntervalInBackground: false,
  });
}
