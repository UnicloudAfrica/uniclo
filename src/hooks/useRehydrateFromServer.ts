/**
 * useRehydrateFromServer — H-05 companion hook.
 *
 * The persist partialize() now keeps only `userEmail` and
 * `lastActiveRole` in localStorage. Everything else (full user object,
 * tenants, session details, abilities, permissions) must be fetched
 * from the server on mount if a session cookie appears to be present.
 *
 * This hook fires once on app mount. If the request succeeds, it
 * populates the auth store via `login()`. If it 401s, we just stay
 * logged out and let the normal public routes render.
 */
import { useEffect, useRef } from "react";
import useAuthStore from "@/stores/authStore";
import config from "@/config";
import logger from "@/utils/logger";

export function useRehydrateFromServer(): void {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Best-effort check: if we have no persisted hint of a prior
    // session, skip the request. The server cookie could still exist,
    // but avoiding a fetch for never-logged-in visitors is worth it.
    const persistedEmail = useAuthStore.getState().userEmail;
    if (!persistedEmail) return;

    (async () => {
      // Pull whatever Bearer token the auth store has. After H-05 the
      // partialize layer persists the top-level `token` field so reload
      // survives without needing the Sanctum cookie path. Cookie-based
      // stateful auth still works as a fallback via `credentials: "include"`.
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      try {
        // Real route is `/api/v1/business/auth/user` (see
        // routes/api.php → ProfileController::index). The previous
        // `/auth/me` URL produced 404 → no `login()` call → next
        // request had no Bearer header → 401 → reflexive logout. That's
        // why every refresh booted the user out.
        const res = await fetch(`${config.baseURL}/business/auth/user`, {
          method: "GET",
          credentials: "include",
          headers,
        });

        if (!res.ok) {
          // 401 or other — session expired or never existed. Clear
          // the persisted hint so the next mount doesn't re-fetch.
          if (res.status === 401) {
            useAuthStore.getState().forceLogout();
          }
          return;
        }

        const payload = (await res.json()) as Record<string, unknown>;
        const data =
          (payload.data as Record<string, unknown> | undefined) ?? payload;

        useAuthStore.getState().login(data as never);
      } catch (err) {
        logger.warn("[auth] rehydrate from server failed:", err);
      }
    })();
  }, []);
}
