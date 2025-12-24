import Echo from "laravel-echo";
import Pusher from "pusher-js";
import config from "./config";
import useAdminAuthStore from "./stores/adminAuthStore";

window.Pusher = Pusher;

/**
 * Initialize Laravel Echo for real-time events.
 * Since we're using a Bearer token for API auth, we need to pass it to the broadcast authorizer.
 */
const createEchoClient = () => {
  const { token } = useAdminAuthStore.getState();
  const apiUrl = import.meta.env.VITE_API_USER_BASE_URL;

  return new Echo({
    broadcaster: "reverb", // Default to Reverb for 2.0
    key: import.meta.env.VITE_REVERB_APP_KEY || "abcde12345",
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || "https") === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${config.adminURL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });
};

export default createEchoClient;
