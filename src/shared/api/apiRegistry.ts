/**
 * API Registry — Centralized role → API client mapping.
 *
 * Maps each dashboard role ("admin" | "tenant" | "client") to its
 * pre-configured API clients, base URL, resource URL prefix, and the
 * unified auth store.
 *
 * Used by the `createResourceHooks` factory so a single hook
 * implementation can serve all three dashboards.
 *
 * Auth: every entry shares the same `useAuthStore` (the 3 legacy
 * per-role shims were removed in the Week-3 cleanup). Role-aware
 * behaviour comes from `urlPrefix` + `redirectPath`, NOT from a
 * separate auth store per role.
 */
import config from "../../config";
import useAuthStore from "@/stores/authStore";
import { createApiClient, createFileApiClient } from "@/utils/createApiClient";
import type { ApiContext } from "@/hooks/useApiContext";

// Re-export ApiContext for convenience
export type { ApiContext };

type AuthStoreHook = typeof useAuthStore;

export interface ApiRegistryEntry {
  /** API client that suppresses toast notifications (for background fetches) */
  silentApi: ReturnType<typeof createApiClient>;
  /** API client that shows toast notifications (for user-initiated mutations) */
  toastApi: ReturnType<typeof createApiClient>;
  /**
   * Binary-aware client — handles `application/pdf`, `image/*`,
   * `text/csv`, and JSON without falling foul of `parseJsonSafely`.
   * Use this for downloads/uploads that previously rolled their own
   * `fetch()`.
   */
  fileApi: ReturnType<typeof createFileApiClient>;
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
  /** The unified Zustand auth store (same instance across all 3 roles) */
  authStore: AuthStoreHook;
}

// ── Admin ────────────────────────────────────────────────────────
const adminEntry: ApiRegistryEntry = {
  silentApi: createApiClient({
    baseURL: config.adminURL,
    authStore: useAuthStore,
    showToasts: false,
    redirectPath: "/admin-signin",
    useSafeJsonParsing: true,
  }),
  toastApi: createApiClient({
    baseURL: config.adminURL,
    authStore: useAuthStore,
    showToasts: true,
    redirectPath: "/admin-signin",
    useSafeJsonParsing: true,
  }),
  fileApi: createFileApiClient({
    baseURL: config.adminURL,
    authStore: useAuthStore,
    redirectPath: "/admin-signin",
  }),
  baseUrl: config.adminURL,
  urlPrefix: "",
  redirectPath: "/admin-signin",
  authStore: useAuthStore,
};

// ── Tenant ───────────────────────────────────────────────────────
const tenantEntry: ApiRegistryEntry = {
  silentApi: createApiClient({
    baseURL: config.tenantURL,
    authStore: useAuthStore,
    showToasts: false,
    redirectPath: "/sign-in",
    useSafeJsonParsing: true,
  }),
  toastApi: createApiClient({
    baseURL: config.tenantURL,
    authStore: useAuthStore,
    showToasts: true,
    redirectPath: "/sign-in",
    useSafeJsonParsing: true,
  }),
  fileApi: createFileApiClient({
    baseURL: config.tenantURL,
    authStore: useAuthStore,
    redirectPath: "/sign-in",
  }),
  baseUrl: config.tenantURL,
  urlPrefix: "/admin",
  redirectPath: "/sign-in",
  authStore: useAuthStore,
};

// ── Client ───────────────────────────────────────────────────────
const clientEntry: ApiRegistryEntry = {
  silentApi: createApiClient({
    baseURL: config.baseURL,
    authStore: useAuthStore,
    showToasts: false,
    redirectPath: "/sign-in",
    useSafeJsonParsing: true,
  }),
  toastApi: createApiClient({
    baseURL: config.baseURL,
    authStore: useAuthStore,
    showToasts: true,
    redirectPath: "/sign-in",
    useSafeJsonParsing: true,
  }),
  fileApi: createFileApiClient({
    baseURL: config.baseURL,
    authStore: useAuthStore,
    redirectPath: "/sign-in",
  }),
  baseUrl: config.baseURL,
  urlPrefix: "/business",
  redirectPath: "/sign-in",
  authStore: useAuthStore,
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
