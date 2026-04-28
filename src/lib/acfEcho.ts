/**
 * Second Echo instance for subscribing to AnyCloudFlow's Reverb server
 * (distinct from `src/echo.ts`, which connects to UniCloud's own Reverb).
 *
 * Authorization goes through UniCloud's proxy endpoint at
 * `/v1/integrations/anycloudflow/broadcasting/auth`, which validates the
 * tenant's ownership of the claimed channel before forwarding the
 * auth request to AnyCloudFlow with the integration's API key.
 */
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import config from "@/config";

// Pusher expects to be global — only attach once. The main `echo.ts` module
// may have already set it; this is idempotent.
if (typeof window !== "undefined") {
  (globalThis.window as unknown).Pusher = Pusher;
}

let instance: Echo<"reverb"> | null = null;

export function getAcfEcho(): Echo<"reverb"> {
  if (typeof window === "undefined") {
    throw new Error("getAcfEcho() called in a non-browser context");
  }
  if (instance) return instance;

  instance = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_ACF_REVERB_APP_KEY || "acf",
    wsHost: import.meta.env.VITE_ACF_REVERB_HOST || "localhost",
    wsPort: Number(import.meta.env.VITE_ACF_REVERB_PORT || 8080),
    wssPort: Number(import.meta.env.VITE_ACF_REVERB_PORT || 8080),
    forceTLS: (import.meta.env.VITE_ACF_REVERB_SCHEME || "http") === "https",
    enabledTransports: ["ws", "wss"],
    // Route the auth request through UniCloud's proxy. UniCloud validates
    // tenant ownership of the channel before proxying to AnyCloudFlow.
    authEndpoint: `${config.baseURL}/v1/integrations/anycloudflow/broadcasting/auth`,
    withCredentials: true,
    auth: {
      headers: {
        Accept: "application/json",
      },
    },
  });

  return instance;
}

export function disconnectAcfEcho(): void {
  if (instance) {
    try {
      instance.disconnect();
    } catch {
      // ignore
    }
    instance = null;
  }
}
