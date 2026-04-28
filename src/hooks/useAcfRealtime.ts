/**
 * Subscribe to an AnyCloudFlow private channel via the AnyCloudFlow Echo
 * instance. Cleans up subscription on unmount and tracks each event's
 * handler reference so unbind() actually removes it.
 */
import { useEffect, useRef } from "react";
import { getAcfEcho } from "@/lib/acfEcho";

type Handler = (event: unknown) => void;

export function useAcfRealtimeEvent(
  channelName: string | null,
  eventName: string,
  handler: Handler,
  { enabled = true }: { enabled?: boolean } = {}
): void {
  // Keep a stable reference so the subscribe effect doesn't re-fire on every
  // render due to the handler identity changing.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled || !channelName) return;
    if (typeof window === "undefined") return;

    const echo = getAcfEcho();
    const channel = echo.private(channelName);
    const stableHandler = (payload: unknown) => handlerRef.current(payload);

    channel.listen(eventName, stableHandler);

    return () => {
      try {
        // laravel-echo's `.stopListening` removes by event + (optionally) handler reference
        channel.stopListening(eventName, stableHandler);
        echo.leave(channelName);
      } catch {
        // ignore teardown races
      }
    };
  }, [channelName, eventName, enabled]);
}

/**
 * Convenience: subscribe to replication sync progress for a specific
 * replication identifier.
 */
export function useAcfSyncProgress<T = unknown>(
  replicationIdentifier: string | null,
  onProgress: (p: T) => void,
): void {
  useAcfRealtimeEvent(
    replicationIdentifier ? `replication.${replicationIdentifier}` : null,
    "sync.progress",
    onProgress,
  );
}
