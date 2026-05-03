/**
 * Real-time connection status hook.
 *
 * Subscribes to the Pusher/Reverb connection lifecycle and exposes:
 *   - status:        "connected" | "connecting" | "unavailable" | "failed" | "disconnected"
 *   - isHealthy:     boolean — true while connected
 *   - lastChange:    Date the status last changed (for UI freshness hints)
 *
 * Pages that drive critical real-time UX (migration status, provisioning
 * progress) should render a small "reconnecting…" badge when this hook
 * reports anything but `connected`. The Pusher client itself does
 * exponential backoff for us; the hook just surfaces the state so UX
 * doesn't silently lie.
 */
import { useEffect, useState } from "react";
import echo from "../echo";
import ToastUtils from "../utils/toastUtil";

type Status =
  | "initialized"
  | "connecting"
  | "connected"
  | "unavailable"
  | "failed"
  | "disconnected";

interface RealtimeConnection {
  status: Status;
  isHealthy: boolean;
  lastChange: Date;
}

let toastShownAt = 0;

/** Don't spam toasts — at most one warn / one recovery per minute. */
const TOAST_THROTTLE_MS = 60_000;

export function useRealtimeConnection(): RealtimeConnection {
  const [status, setStatus] = useState<Status>("initialized");
  const [lastChange, setLastChange] = useState<Date>(new Date());

  useEffect(() => {
    const client = typeof echo === "function" ? echo() : (echo as unknown as ReturnType<typeof echo>);
    const connector = client?.connector as
      | {
          pusher?: {
            connection: {
              state: string;
              bind: (event: string, cb: (s: { current: string }) => void) => void;
              unbind: (event: string, cb: (s: { current: string }) => void) => void;
            };
          };
        }
      | undefined;

    const conn = connector?.pusher?.connection;
    if (!conn) return;

    const handler = (state: { current: string }) => {
      const next = (state.current ?? "disconnected") as Status;
      setStatus(next);
      setLastChange(new Date());

      const now = Date.now();
      if (now - toastShownAt < TOAST_THROTTLE_MS) return;

      if (next === "unavailable" || next === "disconnected" || next === "failed") {
        ToastUtils.warning(
          "Real-time updates paused. We'll keep retrying — refresh the page if it stays this way for more than a minute.",
        );
        toastShownAt = now;
      } else if (next === "connected" && status !== "initialized" && status !== "connected") {
        ToastUtils.success("Real-time updates restored.");
        toastShownAt = now;
      }
    };

    handler({ current: conn.state });
    conn.bind("state_change", handler as unknown as (s: { current: string }) => void);

    return () => {
      conn.unbind("state_change", handler as unknown as (s: { current: string }) => void);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    isHealthy: status === "connected",
    lastChange,
  };
}
