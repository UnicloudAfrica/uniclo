/**
 * API Registry — Centralized role → API client mapping
 *
 * Maps each dashboard role ("admin" | "tenant" | "client") to its
 * pre-configured API clients, base URL, resource URL prefix, and auth store.
 *
 * Used by the `createResourceHooks` factory (Phase 4) so that a single
 * hook implementation can serve all three dashboards.
 */
import config from "../../config";
import useAdminAuthStore from "@/stores/adminAuthStore";
import useTenantAuthStore from "@/stores/tenantAuthStore";
import useClientAuthStore from "@/stores/clientAuthStore";
import { createApiClient } from "@/utils/createApiClient";
import type { ApiContext } from "@/hooks/useApiContext";

// Re-export ApiContext for convenience
export type { ApiContext };

type AuthStoreHook =
  | typeof useAdminAuthStore
  | typeof useTenantAuthStore
  | typeof useClientAuthStore;

export interface ApiRegistryEntry {
  /** API client that suppresses toast notifications (for background fetches) */
  silentApi: ReturnType<typeof createApiClient>;
  /** API client that shows toast notifications (for user-initiated mutations) */
  toastApi: ReturnType<typeof createApiClient>;
  /** The base URL for this role's API (e.g. config.adminURL) */
  baseUrl: string;
  /**
   * URL prefix prepended to resource paths for this role.
   * - Admin:  "" (no prefix, e.g. "/security-groups")
   * - Tenant: "/admin" (e.g. "/admin/security-groups")
   * - Client: "/business" (e.g. "/business/security-groups")
   */
  urlPrefix: string;
  /** The path to redirect to on auth failure */
  redirectPath: string;
  /** The Zustand auth store for this role */
  authStore: AuthStoreHook;
}

// ── Admin ────────────────────────────────────────────────────────
const adminEntry: ApiRegistryEntry = {
  silentApi: createApiClient({
    baseURL: config.adminURL,
    authStore: useAdminAuthStore,
    showToasts: false,
    redirectPath: "/admin-signin",
    useSafeJsonParsing: true,
  }),
  toastApi: createApiClient({
    baseURL: config.adminURL,
    authStore: useAdminAuthStore,
    showToasts: true,
    redirectPath: "/admin-signin",
    useSafeJsonParsing: true,
  }),
  baseUrl: config.adminURL,
  urlPrefix: "",
  redirectPath: "/admin-signin",
  authStore: useAdminAuthStore,
};

// ── Tenant ───────────────────────────────────────────────────────
const tenantEntry: ApiRegistryEntry = {
  silentApi: createApiClient({
    baseURL: config.tenantURL,
    authStore: useTenantAuthStore,
    showToasts: false,
    redirectPath: "/sign-in",
    useSafeJsonParsing: true,
  }),
  toastApi: createApiClient({
    baseURL: config.tenantURL,
    authStore: useTenantAuthStore,
    showToasts: true,
    redirectPath: "/sign-in",
    useSafeJsonParsing: true,
  }),
  baseUrl: config.tenantURL,
  urlPrefix: "/admin",
  redirectPath: "/sign-in",
  authStore: useTenantAuthStore,
};

// ── Client ───────────────────────────────────────────────────────
const clientEntry: ApiRegistryEntry = {
  silentApi: createApiClient({
    baseURL: config.baseURL,
    authStore: useClientAuthStore,
    showToasts: false,
    redirectPath: "/sign-in",
    useSafeJsonParsing: true,
  }),
  toastApi: createApiClient({
    baseURL: config.baseURL,
    authStore: useClientAuthStore,
    showToasts: true,
    redirectPath: "/sign-in",
    useSafeJsonParsing: true,
  }),
  baseUrl: config.baseURL,
  urlPrefix: "/business",
  redirectPath: "/sign-in",
  authStore: useClientAuthStore,
};

// ── Registry ─────────────────────────────────────────────────────

export const apiRegistry: Record<ApiContext, ApiRegistryEntry> = {
  admin: adminEntry,
  tenant: tenantEntry,
  client: clientEntry,
};

/**
 * Convenience helper: get the registry entry for a given context.
 * Throws if the context is invalid (should never happen at runtime).
 */
export const getApiEntry = (context: ApiContext): ApiRegistryEntry => {
  const entry = apiRegistry[context];
  if (!entry) {
    throw new Error(`[apiRegistry] Unknown API context: "${context}"`);
  }
  return entry;
};

export default apiRegistry;
