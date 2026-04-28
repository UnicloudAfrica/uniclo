/**
 * Query key helpers for TanStack Query.
 *
 * M-08: All new queries that fetch tenant-scoped data should wrap
 * their cache keys with `withTenantKey(...)` so two different tenants
 * never share a cache entry. Without this, if a user is logged into
 * tenant A, switches to tenant B (same browser, same React Query
 * cache), and a query fires with the same key before the cache is
 * cleared, they could see A's data under B's UI.
 *
 * Usage:
 *   import { withTenantKey } from "@/utils/queryKeys";
 *
 *   useQuery({
 *     queryKey: withTenantKey(["compute-instances", id]),
 *     queryFn: () => fetchInstance(id),
 *   });
 *
 * The auth store already calls `queryClient.clear()` on tenant switch
 * (see M-08 in authStore.ts), but namespacing is a defence-in-depth
 * measure: it guarantees isolation even if a stale query races the
 * cache clear, and makes it easy to debug which tenant a cached
 * entry belongs to.
 *
 * Callers writing new queries should adopt this pattern. Existing
 * queries can be migrated incrementally.
 */
import useAuthStore from "@/stores/authStore";

export const withTenantKey = (
  key: readonly unknown[],
): readonly unknown[] => {
  const slug = useAuthStore.getState().session?.tenantSlug ?? "default";
  return ["tenant", slug, ...key];
};
