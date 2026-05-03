/**
 * UniCloudFlow API hooks — shared across admin, tenant, and client dashboards.
 *
 * Uses `useApiContext()` to automatically route requests to the correct
 * API endpoint based on the current dashboard context.
 */
import { useCallback, useMemo } from "react";
import { useApiContext } from "@/hooks/useApiContext";

// ── Types ───────────────────────────────────────────────────────

export interface FlowPlan {
  id: number;
  slug: string;
  name: string;
  price_monthly_kobo: number;
  trial_days: number;
  max_servers: number;
  max_sites: number;
  max_databases: number;
  zero_downtime: boolean;
  ssl_management: boolean;
  git_integration: boolean;
  features: string[];
  is_active: boolean;
  subscriptions_count?: number;
}

export interface FlowSubscription {
  id: number;
  tenant_id: number;
  plan_id: number;
  status: "trialing" | "active" | "past_due" | "cancelled";
  leanploy_team_id: string;
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  plan?: FlowPlan;
  tenant?: { id: number; name: string };
  server_links_count?: number;
}

export interface FlowStatus {
  subscribed: boolean;
  subscription?: FlowSubscription;
  is_usable?: boolean;
  is_on_trial?: boolean;
  is_trial_expired?: boolean;
  trial_days_remaining?: number | null;
  can_add_server?: boolean;
  can_add_site?: boolean;
  message?: string;
}

export interface FlowServer {
  id: number;
  name: string;
  ip_address: string;
  status: string;
  php_version?: string;
  ubuntu_version?: string;
  /**
   * Vercel-style auto-issued URL for the underlying Bridge VM.
   * Surfaced by the backend overlay on /flow/servers — null if no
   * floating IP is attached yet.
   */
  temporary_domain?: TemporaryDomain | null;
  /**
   * Bridge link external ID (e.g. srv_uc_6294d192-…) — useful for
   * cross-linking back to admin tooling.
   */
  bridge_server_id?: string | null;
  [key: string]: unknown;
}

export interface FlowDatabase {
  id: number;
  name: string;
  type?: string;
  status?: string;
  [key: string]: unknown;
}

export interface FlowCertificate {
  id: number;
  domains?: string[];
  status?: string;
  expires_at?: string | null;
  [key: string]: unknown;
}

export interface FlowServerLink {
  id: number;
  tenant_id: number;
  subscription_id: number;
  instance_id: number | null;
  leanploy_server_id: number;
  sync_status: string;
  last_synced_at: string | null;
}

export interface FlowSite {
  id: number;
  domain: string;
  project_type: string;
  directory: string;
  repository: string | null;
  branch: string | null;
  status: string;
  /**
   * Vercel/Heroku-style auto-issued URL — present on freshly-created
   * sites (and on retry via POST /sites/{id}/temporary-domain). null
   * means none has been allocated yet (e.g. VM has no public IP yet).
   */
  temporary_domain?: TemporaryDomain | null;
  [key: string]: unknown;
}

/**
 * Auto-issued subdomain a site is reachable on while the customer
 * configures their own DNS — same UX as `*.vercel.app`.
 */
export interface TemporaryDomain {
  domain: string;
  points_to: string;
  https: boolean;
  /** True when the customer chose the label themselves; false for auto-issued. */
  custom?: boolean;
}

export interface TemporaryDomainAvailability {
  available: boolean;
  hostname: string;
  reason?: string;
  suggestion?: string;
}

export interface FlowDeployment {
  id: number;
  status: string;
  commit_hash: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface FlowGitProvider {
  id: number;
  provider: string;
  name: string;
  [key: string]: unknown;
}

export interface FlowRepository {
  id: number | string;
  name: string;
  full_name: string;
  [key: string]: unknown;
}

export interface FlowOverview {
  total_subscriptions: number;
  active: number;
  trialing: number;
  cancelled: number;
  past_due: number;
  total_plans: number;
  active_plans: number;
}

// ── API helper ──────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Core hook that provides Flow API methods using the current dashboard context.
 */
export function useFlowApi() {
  const { apiBaseUrl, authHeaders } = useApiContext();

  // useApiContext rebuilds `authHeaders` (object literal) on every
  // render, so depending on it directly destabilises every downstream
  // useCallback / useMemo and tips consumers into render loops. Derive
  // a stable string key from the bits we actually care about (the
  // Bearer token + tenant slug); the request callback only re-creates
  // when one of those primitives genuinely changes.
  const headersKey = JSON.stringify({
    auth: authHeaders.Authorization ?? null,
    slug: authHeaders["X-Tenant-Slug"] ?? null,
  });

  const request = useCallback(
    async <T>(
      method: string,
      path: string,
      body?: Record<string, unknown>,
    ): Promise<ApiResponse<T>> => {
      const url = `${apiBaseUrl}/flow${path}`;
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...authHeaders,
        },
      };

      if (body && method !== "GET") {
        options.body = JSON.stringify(body);
      }

      // For GET with query params
      let finalUrl = url;
      if (body && method === "GET") {
        const params = new URLSearchParams();
        Object.entries(body).forEach(([k, v]) => {
          if (v !== undefined && v !== null) params.set(k, String(v));
        });
        const qs = params.toString();
        if (qs) finalUrl = `${url}?${qs}`;
      }

      const res = await fetch(finalUrl, options);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Request failed" }));
        // Throw a richer error so callers (e.g. the claim flow) can
        // branch on `status` (409 taken vs 422 invalid) without parsing
        // the message string.
        const wrapped: Error & { status?: number; payload?: unknown } = new Error(
          error.message || `HTTP ${res.status}`,
        );
        wrapped.status = res.status;
        wrapped.payload = error;
        throw wrapped;
      }
      return res.json();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally use headersKey instead of authHeaders to avoid re-creating on every render
    [apiBaseUrl, headersKey],
  );

  // CRITICAL: memoize the returned object on `request` so consumers
  // can put `api` (or any of its bound methods) in a `useEffect` /
  // `useCallback` dep list without triggering an infinite re-render
  // loop. Without this, useFlowApi() returns a fresh object literal
  // every render → any consumer that effects on `[api, …]` schedules
  // another render → loop → Chrome kills the tab with
  // RESULT_CODE_HUNG. SitesTab specifically tripped this.
  return useMemo(() => ({
    // Plans & Status
    getPlans: () => request<FlowPlan[]>("GET", "/plans"),
    getStatus: () => request<FlowStatus>("GET", "/status"),
    subscribe: (planSlug: string) =>
      request<FlowSubscription>("POST", "/subscribe", { plan_slug: planSlug }),
    convertToPaid: (planSlug: string) =>
      request<FlowSubscription>("POST", "/convert-to-paid", { plan_slug: planSlug }),
    cancel: () => request<void>("DELETE", "/cancel"),

    /**
     * Renew an active or past_due subscription with a fresh Paystack payment.
     * `payment_reference` is the reference returned by Paystack after the
     * tenant completes the inline checkout flow on FlowBilling.
     */
    renewSubscription: (paymentReference: string) =>
      request<FlowSubscription>("POST", "/subscription/renew", {
        payment_reference: paymentReference,
      }),

    /**
     * Change plan (active subscription only). Same Paystack-reference
     * pattern as `convertToPaid`.
     */
    changePlan: (planSlug: string, paymentReference: string) =>
      request<FlowSubscription>("POST", "/subscription/change-plan", {
        plan_slug: planSlug,
        payment_reference: paymentReference,
      }),

    // Servers
    getServers: () =>
      request<{ servers: FlowServer[]; linked_server_ids: number[] }>("GET", "/servers"),
    getServer: (serverId: number) => request<FlowServer>("GET", `/servers/${serverId}`),
    connectServer: (leanployServerId: number, instanceId?: number) =>
      request<FlowServerLink>("POST", "/servers/connect", {
        leanploy_server_id: leanployServerId,
        instance_id: instanceId,
      }),
    disconnectServer: (linkId: number) => request<void>("DELETE", `/servers/${linkId}/disconnect`),
    /**
     * Allocate (or retry) the temporary subdomain for the underlying
     * Bridge VM. Pass `name` to claim a custom label — the platform
     * builds `<name>.unicloudafrica.ng`. Omit it for an auto-issued slug.
     * 409 when the name is taken, 422 for invalid format.
     */
    attachServerTemporaryDomain: (serverId: number, name?: string) =>
      request<TemporaryDomain>("POST", `/servers/${serverId}/temporary-domain`, {
        name: name ?? undefined,
      }),

    /**
     * Real-time availability check for a customer-typed subdomain label.
     * Cheap (single Cloudflare GET) so the UI can debounce-call on each
     * keystroke. `scope` defaults to "flow" — pass "compute" when the
     * input is for a Bridge VM.
     */
    checkTemporaryDomainAvailability: (name: string, scope: "flow" | "compute" = "flow") =>
      request<TemporaryDomainAvailability>(
        "GET",
        `/temporary-domain/availability`,
        { name, scope },
      ),

    // Sites
    getSites: (serverId: number) => request<FlowSite[]>("GET", `/servers/${serverId}/sites`),
    createSite: (serverId: number, data: Record<string, unknown>) =>
      request<FlowSite>("POST", `/servers/${serverId}/sites`, data),
    updateSite: (serverId: number, siteId: number, data: Record<string, unknown>) =>
      request<FlowSite>("PUT", `/servers/${serverId}/sites/${siteId}`, data),
    deleteSite: (serverId: number, siteId: number) =>
      request<void>("DELETE", `/servers/${serverId}/sites/${siteId}`),

    /**
     * Allocate or rename the temporary subdomain for a site. Pass
     * `name` to claim/rename to a custom label. Idempotent for the
     * auto-issued case (no name) when one already exists.
     * 409 when taken, 422 for invalid format.
     */
    attachSiteTemporaryDomain: (serverId: number, siteId: number, name?: string) =>
      request<TemporaryDomain>(
        "POST",
        `/servers/${serverId}/sites/${siteId}/temporary-domain`,
        { name: name ?? undefined },
      ),

    // Deployments
    deploy: (serverId: number, siteId: number) =>
      request<FlowDeployment>("POST", `/servers/${serverId}/sites/${siteId}/deploy`),
    getDeployments: (serverId: number, siteId: number) =>
      request<FlowDeployment[]>("GET", `/servers/${serverId}/sites/${siteId}/deployments`),

    // Git Providers
    getGitProviders: () => request<FlowGitProvider[]>("GET", "/git-providers"),
    connectGitProvider: (data: { provider: string; token: string; name?: string }) =>
      request<FlowGitProvider>("POST", "/git-providers", data as Record<string, unknown>),
    deleteGitProvider: (providerId: number) =>
      request<void>("DELETE", `/git-providers/${providerId}`),
    getRepositories: (providerId: number, search?: string) =>
      request<FlowRepository[]>("GET", `/git-providers/${providerId}/repositories`, {
        search: search || undefined,
      }),

    // Databases
    getDatabases: (serverId: number) =>
      request<unknown[]>("GET", `/servers/${serverId}/databases`),
    createDatabase: (serverId: number, data: Record<string, unknown>) =>
      request<unknown>("POST", `/servers/${serverId}/databases`, data),

    // SSL
    getCertificates: (serverId: number, siteId: number) =>
      request<unknown[]>("GET", `/servers/${serverId}/sites/${siteId}/certificates`),
    createCertificate: (serverId: number, siteId: number, domains: string[]) =>
      request<unknown>("POST", `/servers/${serverId}/sites/${siteId}/certificates`, { domains }),

    // Env
    getEnv: (serverId: number, siteId: number) =>
      request<string>("GET", `/servers/${serverId}/sites/${siteId}/env`),
    updateEnv: (serverId: number, siteId: number, content: string) =>
      request<void>("PUT", `/servers/${serverId}/sites/${siteId}/env`, { content }),
  }), [request]);
}

/**
 * Admin-only Flow API methods (plan management, subscription management, etc.)
 */
export function useAdminFlowApi() {
  const { apiBaseUrl, authHeaders } = useApiContext();

  const request = useCallback(
    async <T>(
      method: string,
      path: string,
      body?: Record<string, unknown>,
    ): Promise<{ success: boolean; data: T; message?: string }> => {
      const url = `${apiBaseUrl}/flow${path}`;
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...authHeaders,
        },
      };

      if (body && method !== "GET") {
        options.body = JSON.stringify(body);
      }

      let finalUrl = url;
      if (body && method === "GET") {
        const params = new URLSearchParams();
        Object.entries(body).forEach(([k, v]) => {
          if (v !== undefined && v !== null) params.set(k, String(v));
        });
        const qs = params.toString();
        if (qs) finalUrl = `${url}?${qs}`;
      }

      const res = await fetch(finalUrl, options);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Request failed" }));
        // Throw a richer error so callers (e.g. the claim flow) can
        // branch on `status` (409 taken vs 422 invalid) without parsing
        // the message string.
        const wrapped: Error & { status?: number; payload?: unknown } = new Error(
          error.message || `HTTP ${res.status}`,
        );
        wrapped.status = res.status;
        wrapped.payload = error;
        throw wrapped;
      }
      return res.json();
    },
    [apiBaseUrl, authHeaders],
  );

  return {
    getOverview: () => request<FlowOverview>("GET", "/overview"),
    getPlans: () => request<FlowPlan[]>("GET", "/plans"),
    createPlan: (data: Record<string, unknown>) => request<FlowPlan>("POST", "/plans", data),
    updatePlan: (planId: number, data: Record<string, unknown>) =>
      request<FlowPlan>("PUT", `/plans/${planId}`, data),
    getSubscriptions: (params?: Record<string, unknown>) =>
      request<{ data: FlowSubscription[] }>("GET", "/subscriptions", params),
    enableForTenant: (tenantId: number, planSlug: string, skipTrial = true) =>
      request<FlowSubscription>("POST", "/enable-for-tenant", {
        tenant_id: tenantId,
        plan_slug: planSlug,
        skip_trial: skipTrial,
      }),
    forceActivate: (subscriptionId: number, planSlug?: string) =>
      request<FlowSubscription>("POST", `/subscriptions/${subscriptionId}/force-activate`, {
        plan_slug: planSlug,
      }),
    deactivate: (subscriptionId: number) =>
      request<void>("POST", `/subscriptions/${subscriptionId}/deactivate`),
    getRemoteStatus: (subscriptionId: number) =>
      request<unknown>("GET", `/subscriptions/${subscriptionId}/remote-status`),
  };
}
