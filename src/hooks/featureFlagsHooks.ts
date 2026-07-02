/**
 * Platform feature-flag hooks.
 *
 * Reads the public `GET /api/v1/features` endpoint (no auth, throttled),
 * which mirrors the backend `config('features')` array as booleans. This is
 * the honest FE surface for backend feature flags — it replaces ad-hoc
 * `window.__*__` globals that were never assigned anywhere.
 *
 * The `/features` route is root-scoped (`/api/v1/features`), not audience
 * prefixed, so we pin `baseUrl: config.baseURL` to reach it regardless of
 * which dashboard (admin/tenant/client) is active.
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import config from "@/config";

/** Boolean feature-flag map keyed by the backend `config('features')` keys. */
export type FeatureFlags = Record<string, boolean>;

const fetchFeatureFlags = async (): Promise<FeatureFlags> => {
  const res = await api.get<{ data?: FeatureFlags }>("/features", {
    silent: true,
    baseUrl: config.baseURL,
  });
  return res?.data ?? {};
};

/**
 * Fetch the platform feature-flag map. Cached for 5 minutes; flags change
 * rarely and a missing/failed fetch resolves to `{}` so callers fail closed
 * (flag reads default to `false`).
 */
export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ["feature-flags"],
    queryFn: fetchFeatureFlags,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });
};
