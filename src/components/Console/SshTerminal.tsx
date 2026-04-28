import { useEffect, useRef, useState, useCallback, type JSX } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { useApiContext } from "@/hooks/useApiContext";

type SshSessionResponse = {
  session_id: string;
  ticket: string;
  subprotocol: string;
  ws_url: string;
  expires_at: string;
  cols: number;
  rows: number;
};

type SshConnectionStatus = "idle" | "requesting" | "connecting" | "connected" | "closed" | "error";

type SshTerminalProps = {
  instanceId: string | number;
  onStatusChange?: (status: SshConnectionStatus) => void;
  onError?: (message: string) => void;
  className?: string;
};

/**
 * xterm.js-backed SSH terminal.
 *
 * Flow:
 *   1. POST /api/v1/business/instances/{id}/ssh-sessions
 *      → { ticket, subprotocol, ws_url }
 *   2. new WebSocket(ws_url, [subprotocol])
 *      The ticket travels in Sec-WebSocket-Protocol (NOT URL query).
 *   3. Server validates ticket + Origin, sends 101 Switching Protocols.
 *   4. Stdin → binary frames (ArrayBuffer)
 *      Control → text frames (JSON: { type: "resize"|"ping" })
 *      Server output → binary frames → term.write()
 */
const SshTerminal = ({
  instanceId,
  onStatusChange,
  onError,
  className = "",
}: SshTerminalProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const keepAliveRef = useRef<number | null>(null);
  const encoderRef = useRef<TextEncoder>(new TextEncoder());

  const [status, setStatus] = useState<SshConnectionStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { context, apiBaseUrl, authHeaders } = useApiContext();

  const updateStatus = useCallback(
    (next: SshConnectionStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  const reportError = useCallback(
    (msg: string) => {
      setErrorMsg(msg);
      onError?.(msg);
      updateStatus("error");
    },
    [onError, updateStatus]
  );

  const requestSession = useCallback(async (): Promise<SshSessionResponse | null> => {
    updateStatus("requesting");

    const encodedId = encodeURIComponent(String(instanceId));
    const prefix =
      context === "admin" ? "/admin" : context === "tenant" ? "/tenant" : "/business";
    const path = `${prefix}/instances/${encodedId}/ssh-sessions`;

    const term = termRef.current;
    const body = JSON.stringify({
      cols: term?.cols ?? 80,
      rows: term?.rows ?? 24,
    });

    try {
      const res = await fetch(`${apiBaseUrl}${path}`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (data && typeof data === "object" && "message" in data && String(data.message)) ||
          `Failed to create SSH session (HTTP ${res.status})`;
        reportError(msg);
        return null;
      }

      return data as SshSessionResponse;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error creating SSH session";
      reportError(msg);
      return null;
    }
  }, [apiBaseUrl, authHeaders, context, instanceId, reportError, updateStatus]);

  const openWebSocket = useCallback(
    (session: SshSessionResponse) => {
      updateStatus("connecting");
      sessionIdRef.current = session.session_id;

      let ws: WebSocket;
      try {
        // Ticket travels via Sec-WebSocket-Protocol — the server reads it
        // from there, not from the URL.
        ws = new WebSocket(session.ws_url, [session.subprotocol]);
      } catch (err: unknown) {
        reportError(err instanceof Error ? err.message : "Failed to open WebSocket");
        return;
      }

      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        updateStatus("connected");
        const term = termRef.current;
        if (term) {
          // Send initial resize so the server's PTY is sized correctly.
          ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
        }
        // Keepalive ping every 30s so idle timeout doesn't fire.
        keepAliveRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      ws.onmessage = (event: MessageEvent) => {
        const term = termRef.current;
        if (!term) return;

        if (event.data instanceof ArrayBuffer) {
          const bytes = new Uint8Array(event.data);
          term.write(bytes);
        } else if (typeof event.data === "string") {
          // Server shouldn't normally send text frames for output.
          term.write(event.data);
        }
      };

      ws.onerror = () => {
        reportError("Terminal connection error.");
      };

      ws.onclose = (event: CloseEvent) => {
        if (keepAliveRef.current) {
          window.clearInterval(keepAliveRef.current);
          keepAliveRef.current = null;
        }
        if (status !== "error") {
          updateStatus("closed");
        }
        const term = termRef.current;
        if (term && event.reason) {
          term.writeln(`\r\n\x1b[33m[session closed: ${event.reason}]\x1b[0m`);
        }
      };
    },
    [reportError, status, updateStatus]
  );

  const connect = useCallback(async () => {
    const session = await requestSession();
    if (session) {
      openWebSocket(session);
    }
  }, [openWebSocket, requestSession]);

  // Initialise xterm + connect on mount.
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Code", "Source Code Pro", Consolas, "Liberation Mono", monospace',
      fontSize: 13,
      theme: {
        background: "#0b1020",
        foreground: "#e5e7eb",
        cursor: "#60a5fa",
        cursorAccent: "#0b1020",
        selectionBackground: "#1e293b",
      },
      scrollback: 2000,
      convertEol: true,
    });

    const fit = new FitAddon();
    const webLinks = new WebLinksAddon();
    term.loadAddon(fit);
    term.loadAddon(webLinks);
    term.open(containerRef.current);

    try {
      fit.fit();
    } catch {
      /* ignore */
    }

    termRef.current = term;
    fitRef.current = fit;

    // Keystrokes → BINARY frames so the server knows they are stdin
    // bytes and never misinterprets them as JSON control.
    term.onData((data: string) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        const bytes = encoderRef.current.encode(data);
        // Uint8Array.buffer may be larger than needed if the view is a slice;
        // slice() returns a tight ArrayBuffer.
        ws.send(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      }
    });

    // Resize events → TEXT JSON control frames.
    term.onResize(({ cols, rows }) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });

    // Refit on window resize.
    const handleWindowResize = () => {
      try {
        fit.fit();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("resize", handleWindowResize);

    // Kick off the SSH session.
    connect();

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      if (keepAliveRef.current) {
        window.clearInterval(keepAliveRef.current);
        keepAliveRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReconnect = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setErrorMsg(null);
    connect();
  };

  return (
    <div className={`relative w-full h-full bg-[#0b1020] ${className}`}>
      {status === "error" && errorMsg && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
          <div className="max-w-sm p-4 bg-red-950/90 border border-red-700 rounded">
            <h3 className="text-red-300 font-semibold mb-2">Terminal Error</h3>
            <p className="text-sm text-red-100 mb-3">{errorMsg}</p>
            <button
              onClick={handleReconnect}
              className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}
      {status === "requesting" || status === "connecting" ? (
        <div className="absolute inset-x-0 top-0 z-10 text-xs text-center text-blue-300 bg-blue-900/40 py-1">
          {status === "requesting" ? "Requesting session…" : "Opening secure channel…"}
        </div>
      ) : null}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default SshTerminal;
