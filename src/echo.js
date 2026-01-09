import Echo from "laravel-echo";
import Pusher from "pusher-js";
import config from "./config";
window.Pusher = Pusher;

/**
 * Initialize Laravel Echo for real-time events.
 * Uses HttpOnly cookies for auth (no Bearer tokens in JS).
 */
const createEchoClient = () => {
  return new Echo({
    broadcaster: "reverb", // Default to Reverb for 2.0
    key: import.meta.env.VITE_REVERB_APP_KEY || "abcde12345",
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || "https") === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${config.baseURL}/broadcasting/auth`,
    withCredentials: true,
    auth: {
      headers: {
        Accept: "application/json",
      },
    },
  });
};

export default createEchoClient;
