/**
 * AcfRealtimeStatus — small pill that surfaces the AnyCloudFlow Reverb
 * connection state in the admin headbar.
 *
 * States:
 *   connected     — green, steady. Realtime events are flowing.
 *   connecting    — yellow, spinner. Initial handshake or reconnect.
 *   unavailable   — red. No socket; we're in polling fallback.
 *
 * Clicking the pill attempts a forced reconnect (tears down the current
 * connector and lets the Echo singleton recreate it on next read). The
 * detailed status (host, transport, last error) lives in the tooltip.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { getAcfEcho, disconnectAcfEcho } from "@/lib/acfEcho";

type ConnState = "connected" | "connecting" | "unavailable";

interface StatusMeta {
  host: string;
  transport: string;
  lastEvent: string | null;
  lastError: string | null;
}

/** Pusher.js connection state strings we care about. */
const STATE_MAP: Record<string, ConnState> = {
  initialized: "connecting",
  connecting: "connecting",
  connected: "connected",
  unavailable: "unavailable",
  failed: "unavailable",
  disconnected: "unavailable",
};

function presentation(state: ConnState): {
  dot: string;
  text: string;
  label: string;
  icon: React.ReactNode;
} {
  switch (state) {
    case "connected":
      return {
        dot: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-300",
        label: "Realtime",
        icon: <Wifi size={12} />,
      };
    case "connecting":
      return {
        dot: "bg-amber-400 animate-pulse",
        text: "text-amber-700 dark:text-amber-300",
        label: "Reconnecting",
        icon: <RefreshCw size={12} className="animate-spin" />,
      };
    case "unavailable":
    default:
      return {
        dot: "bg-rose-500",
        text: "text-rose-700 dark:text-rose-300",
        label: "Offline",
        icon: <WifiOff size={12} />,
      };
  }
}

/**
 * Subscribe to the underlying Pusher connector's state_change event.
 * laravel-echo's `reverb` broadcaster uses pusher-js under the hood
 * and exposes `.connector.pusher.connection` — we tap that without
 * binding to any application channel.
 */
function useAcfConnectionState(): [ConnState, StatusMeta] {
  const [state, setState] = useState<ConnState>("connecting");
  const metaRef = useRef<StatusMeta>({
    host: "",
    transport: "",
    lastEvent: null,
    lastError: null,
  });
  const [metaTick, setMetaTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let disposed = false;
    let echo: ReturnType<typeof getAcfEcho>;
    try {
      echo = getAcfEcho();
    } catch {
      setState("unavailable");
      return;
    }

    // The Echo<reverb> type doesn't publicly expose the Pusher connector,
    // so we go via `unknown` rather than rely on laravel-echo internals.
    const connector = (echo as unknown as { connector?: { pusher?: unknown } })
      .connector;
    const pusher = (connector as { pusher?: unknown } | undefined)?.pusher as
      | {
          connection: {
            bind: (evt: string, cb: (...args: unknown[]) => void) => void;
            unbind: (evt: string, cb: (...args: unknown[]) => void) => void;
            state?: string;
          };
          config?: { wsHost?: string; forceTLS?: boolean };
        }
      | undefined;

    if (!pusher) {
      setState("unavailable");
      return;
    }

    metaRef.current.host = pusher.config?.wsHost ?? "";
    setMetaTick((n) => n + 1);

    const applyRaw = (raw: string | undefined) => {
      const mapped = raw ? (STATE_MAP[raw] ?? "connecting") : "connecting";
      if (disposed) return;
      setState(mapped);
    };

    const onStateChange = (...args: unknown[]) => {
      const payload = args[0] as { current?: string } | undefined;
      metaRef.current.lastEvent = new Date().toISOString();
      applyRaw(payload?.current);
      setMetaTick((n) => n + 1);
    };
    const onError = (...args: unknown[]) => {
      const err = args[0] as { error?: { message?: string } } | undefined;
      metaRef.current.lastError = err?.error?.message ?? "connection error";
      setMetaTick((n) => n + 1);
    };

    // Seed from current state so we don't wait for an event after hot reload.
    applyRaw(pusher.connection.state);

    pusher.connection.bind("state_change", onStateChange);
    pusher.connection.bind("error", onError);

    return () => {
      disposed = true;
      try {
        pusher.connection.unbind("state_change", onStateChange);
        pusher.connection.unbind("error", onError);
      } catch {
        // ignore teardown races
      }
    };
  }, []);

  // metaTick is only used to force re-render when metaRef mutates; we read
  // the current ref on render.
  void metaTick;
  return [state, metaRef.current];
}

export interface AcfRealtimeStatusProps {
  /** Compact mode (icon only) for tight headers. */
  compact?: boolean;
  /** Optional className for the outer button. */
  className?: string;
}

export function AcfRealtimeStatus({
  compact = false,
  className,
}: AcfRealtimeStatusProps) {
  const [state, meta] = useAcfConnectionState();
  const pres = presentation(state);
  const [reconnecting, setReconnecting] = useState(false);

  const forceReconnect = useCallback(() => {
    setReconnecting(true);
    try {
      disconnectAcfEcho();
      // Re-creating the singleton eagerly means the new connection
      // handshake starts immediately; the state_change handler in the
      // next mount cycle will flip us back to "connecting" → "connected".
      getAcfEcho();
    } catch {
      // ignore — useAcfConnectionState will settle to "unavailable"
    } finally {
      // Small delay so the spinner is perceptible.
      setTimeout(() => setReconnecting(false), 600);
    }
  }, []);

  const tooltip = [
    `AnyCloudFlow realtime: ${state}`,
    meta.host ? `host: ${meta.host}` : null,
    meta.lastEvent ? `last event: ${meta.lastEvent}` : null,
    meta.lastError ? `last error: ${meta.lastError}` : null,
    "Click to force reconnect",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <button
      type="button"
      onClick={forceReconnect}
      disabled={reconnecting}
      title={tooltip}
      aria-label={`AnyCloudFlow realtime status: ${pres.label}. Click to reconnect.`}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2 py-1 text-xs font-medium transition-colors",
        "hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800",
        "disabled:cursor-wait disabled:opacity-60",
        pres.text,
        className ?? "",
      ].join(" ")}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${pres.dot}`}
        aria-hidden="true"
      />
      {!compact && (
        <>
          <span className="hidden sm:inline">{pres.label}</span>
          <span className="sm:hidden" aria-hidden="true">
            {reconnecting ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              pres.icon
            )}
          </span>
        </>
      )}
      {compact && (
        <span aria-hidden="true">
          {reconnecting ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <Activity size={12} />
          )}
        </span>
      )}
    </button>
  );
}

export default AcfRealtimeStatus;
