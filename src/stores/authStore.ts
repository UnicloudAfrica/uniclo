/**
 * Unified Auth Store — Single source of truth for all authentication state.
 *
 * Replaces the 3 separate stores (adminAuthStore, tenantAuthStore, clientAuthStore)
 * and the sessionUtils coordination layer with ONE Zustand store.
 *
 * Key improvements:
 *   - One localStorage key: "unicloud_auth"
 *   - No token: null bug (auth is cookie-based, token field removed)
 *   - Role-aware base URL resolution for API calls
 *   - Single getAuthHeaders() used by the unified API client
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import type { User, Tenant, TenantContext } from "../types/auth";
import { setUser as setSentryUser } from "@/utils/sentry";
import { queryClient } from "@/lib/queryClient";
import ToastUtils from "@/utils/toastUtil";

// ─── Safe localStorage wrapper (M-01) ─────────────────────────────────
// Wraps localStorage access so quota-exceeded errors, private-mode
// disabled storage, or SSR contexts fail soft instead of crashing the
// persist middleware.
const safeStorage: StateStorage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Quota exceeded or storage disabled — clear the key and drop
      // the write. Swallow nested errors silently.
      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

// ─── Types ───────────────────────────────────────────────────────────

export type AuthRole = "admin" | "tenant" | "client";

export interface Session {
  role: AuthRole;
  tenantSlug: string | null;
  tenantId: string | null;
  workspaceRole: string | null;
  abilities: string[];
  cloudRoles: string[];
  cloudAbilities: string[];
  permissions: string[];
  expiresAt: string | null;
  isCentralDomain: boolean;
  currentDomain: string | null;
}

export interface UnifiedAuthState {
  // ── Core auth ──
  user: User | null;
  userEmail: string | null;
  session: Session | null;
  isAuthenticated: boolean;
  twoFactorRequired: boolean;
  hasHydrated: boolean;

  /** @deprecated Use `session?.role` instead. */
  role: AuthRole | null;
  /** @deprecated Always null — auth is cookie-based. */
  token: string | null;

  // ── Backward-compat top-level aliases (mirror session fields) ──
  /** @deprecated Use `session?.cloudRoles` */
  cloudRoles: string[];
  /** @deprecated Use `session?.cloudAbilities` */
  cloudAbilities: string[];
  /** @deprecated Use `session?.abilities` */
  abilities: string[];
  /** Granular user permissions from RBAC system. */
  permissions: string[];
  /** @deprecated Use `session?.workspaceRole` */
  workspaceRole: string | null;
  /** @deprecated Use `session?.isCentralDomain` */
  isCentralDomain: boolean;
  /** @deprecated Use `session?.currentDomain` */
  currentDomain: string | null;

  // ── Tenant context ──
  tenant: Tenant | null;
  domain: string | null;
  currentTenant: Tenant | null;
  availableTenants: Tenant[];

  // ── Actions ──
  login: (response: LoginResponse) => void;
  logout: () => Promise<void>;
  forceLogout: () => void;
  setSession: (partial: Partial<SessionUpdate>) => void;
  clearSession: () => void;
  switchTenant: (tenantSlug: string) => Promise<boolean>;
  setTwoFactorRequired: (value: boolean) => void;
  clearTwoFactorRequirement: () => void;
  setUser: (user: User | null) => void;
  setUserEmail: (email: string | null) => void;
  clearUserEmail: () => void;
  setAvailableTenants: (tenants: Tenant[]) => void;
  setHasHydrated: (value: boolean) => void;
  initializeTenantContext: () => void;
  /** @deprecated No-op — auth is cookie-based */
  setToken: (token: string | null) => void;
  /** @deprecated No-op */
  clearToken: () => void;
  /** @deprecated Use setSession({ role }) */
  setRole: (role: string | null) => void;
  /** @deprecated Use setSession({ tenant }) */
  setTenant: (tenant: Tenant | null) => void;
  /** @deprecated Use setSession({ domain }) */
  setDomain: (domain: string | null) => void;
  /** @deprecated Use setSession({ cloudRoles }) */
  setCloudRoles: (roles: string[]) => void;
  /** @deprecated Use setSession({ cloudAbilities }) */
  setCloudAbilities: (abilities: string[]) => void;
  /** @deprecated Use setSession({ abilities }) */
  setAbilities: (abilities: string[]) => void;
  /** @deprecated Use setSession({ workspaceRole }) */
  setWorkspaceRole: (role: string | null) => void;
  /** @deprecated Use setSession or set currentTenant directly */
  setCurrentTenant: (tenant: Tenant | null) => void;
  /** @deprecated Use initializeTenantContext() */
  setIsCentralDomain: (value: boolean) => void;
  /** @deprecated Use initializeTenantContext() */
  setCurrentDomain: (value: string | null) => void;
  /** @deprecated Use initializeTenantContext() */
  updateContext: (context: TenantContext) => void;

  // ── Computed helpers ──
  getAuthHeaders: () => Record<string, string>;
  getRole: () => AuthRole | null;
  /** @deprecated Use getRole() instead */
  getEffectiveRole: () => AuthRole | null;
  isAdmin: () => boolean;
  isTenant: () => boolean;
  isClient: () => boolean;
  setPermissions: (permissions: string[]) => void;
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
  hasAllPermissions: (perms: string[]) => boolean;
}

export interface LoginResponse {
  user?: User;
  email?: string;
  role?: AuthRole;
  tenant?: Tenant;
  domain?: string;
  token?: string;
  access_token?: string;
  abilities?: string[];
  cloudRoles?: string[];
  cloudAbilities?: string[];
  workspaceRole?: string | null;
  permissions?: string[];
  [key: string]: unknown;
}

interface SessionUpdate {
  user: User | null;
  userEmail: string | null;
  role: AuthRole;
  tenant: Tenant | null;
  domain: string | null;
  token: string | null;
  isAuthenticated: boolean;
  twoFactorRequired: boolean;
  abilities: string[];
  permissions: string[];
  cloudRoles: string[];
  cloudAbilities: string[];
  workspaceRole: string | null;
  currentTenant: Tenant | null;
  isCentralDomain: boolean;
  currentDomain: string | null;
  availableTenants: Tenant[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

export const inferTenantContext = (): TenantContext => {
  if (typeof window === "undefined") {
    return {
      isCentralDomain: true,
      currentDomain: "localhost",
      currentTenant: null,
    };
  }

  const hostname = globalThis.window.location.hostname;
  const isCentral =
    hostname === "unicloudafrica.com" || hostname === "localhost" || hostname.includes("127.0.0.1");
  const tenantSlug = !isCentral ? hostname.split(".")[0] : null;

  return {
    isCentralDomain: isCentral,
    currentDomain: hostname,
    currentTenant: tenantSlug ? { slug: tenantSlug } : null,
  };
};

const INITIAL_CONTEXT = inferTenantContext();

const _resolveAccessToken = (payload: Record<string, unknown> | null | undefined): string | null => {
  if (!payload) return null;

  const directToken = payload.token;
  if (typeof directToken === "string" && directToken.trim() !== "") {
    return directToken;
  }

  const accessToken = payload.access_token;
  if (typeof accessToken === "string" && accessToken.trim() !== "") {
    return accessToken;
  }

  const data = payload.data;
  if (data && typeof data === "object") {
    return resolveAccessToken(data as Record<string, unknown>);
  }

  return null;
};

const createInitialState = () => ({
  user: null as User | null,
  userEmail: null as string | null,
  session: null as Session | null,
  isAuthenticated: false,
  twoFactorRequired: false,
  hasHydrated: false,
  role: null as AuthRole | null,
  token: null as string | null,
  cloudRoles: [] as string[],
  cloudAbilities: [] as string[],
  abilities: [] as string[],
  permissions: [] as string[],
  workspaceRole: null as string | null,
  isCentralDomain: INITIAL_CONTEXT.isCentralDomain,
  currentDomain: INITIAL_CONTEXT.currentDomain,
  tenant: null as Tenant | null,
  domain: null as string | null,
  currentTenant: INITIAL_CONTEXT.currentTenant,
  availableTenants: [] as Tenant[],
});

// ─── Store ───────────────────────────────────────────────────────────

let externalSetHasHydrated: ((value: boolean) => void) | undefined;

const useAuthStore = create<UnifiedAuthState>()(
  persist(
    (set, get) => {
      const setHasHydrated = (value: boolean) => set({ hasHydrated: value });
      externalSetHasHydrated = setHasHydrated;

      const resetState = () => {
        const context = inferTenantContext();
        set((state) => ({
          ...createInitialState(),
          currentTenant: context.currentTenant,
          hasHydrated: state.hasHydrated,
        }));
      };

      return {
        ...createInitialState(),

        // ── Login ──
        // Auth is now cookie-based (Sanctum SPA). Token is no longer
        // stored in state or localStorage — the httpOnly session cookie
        // set by the server is the sole auth credential.
        login: (response: LoginResponse) => {
          const context = inferTenantContext();
          const role = (response.role as AuthRole) || "client";

          const abilitiesArr = Array.isArray(response.abilities) ? response.abilities : [];
          const cloudRolesArr = Array.isArray(response.cloudRoles) ? response.cloudRoles : [];
          const cloudAbilitiesArr = Array.isArray(response.cloudAbilities)
            ? response.cloudAbilities
            : [];
          const permissionsArr = Array.isArray(response.permissions) ? response.permissions : [];

          // Tag Sentry with non-PII identifiers so subsequent errors
          // are attributable. We deliberately do NOT send email/name.
          if (response.user?.id != null) {
            setSentryUser({
              id: response.user.id,
              tenant_id: response.tenant?.id?.toString(),
              role,
            });
          }

          set({
            user: response.user || null,
            userEmail: response.email || response.user?.email || null,
            isAuthenticated: true,
            twoFactorRequired: false,
            role,
            token: null, // Cookie-based auth — no token stored
            abilities: abilitiesArr,
            cloudRoles: cloudRolesArr,
            cloudAbilities: cloudAbilitiesArr,
            permissions: permissionsArr,
            workspaceRole: response.workspaceRole ?? null,
            isCentralDomain: context.isCentralDomain,
            currentDomain: context.currentDomain,
            tenant: response.tenant || null,
            domain: response.domain || null,
            currentTenant: response.tenant || context.currentTenant,
            session: {
              role,
              tenantSlug: response.tenant?.slug || context.currentTenant?.slug || null,
              tenantId: response.tenant?.id?.toString() || null,
              workspaceRole: response.workspaceRole ?? null,
              abilities: abilitiesArr,
              cloudRoles: cloudRolesArr,
              cloudAbilities: cloudAbilitiesArr,
              permissions: permissionsArr,
              expiresAt: null,
              isCentralDomain: context.isCentralDomain,
              currentDomain: context.currentDomain,
            },
          });
        },

        // ── Logout (C-07) ──
        // Server-confirmed logout: POST to server FIRST, only clear
        // local state on 2xx (or 401, which means the session was
        // already invalidated). On network failure or 5xx we surface
        // the error to the caller and leave local state intact so the
        // caller can retry or call forceLogout() as an escape hatch.
        logout: async () => {
          const state = get();
          const role = state.session?.role;

          const config = await import("../config");
          const baseUrl =
            role === "admin"
              ? config.default.adminURL
              : role === "tenant"
                ? config.default.tenantURL
                : config.default.baseURL;

          let response: Response;
          try {
            response = await fetch(`${baseUrl}/business/auth/logout`, {
              method: "POST",
              headers: state.getAuthHeaders(),
              credentials: "include",
            });
          } catch (err) {
            // Network error — don't clear state, let caller handle.
            ToastUtils.error(
              "Couldn't reach server to log out. Check your connection and try again."
            );
            throw err;
          }

          // 401 is acceptable — session was already invalidated on the
          // server side; clearing local state is still safe.
          if (!response.ok && response.status !== 401) {
            ToastUtils.error(
              "Logout failed. Please try again or contact support."
            );
            throw new Error(`Logout failed with status ${response.status}`);
          }

          // Server confirmed logout — safe to clear local state.
          setSentryUser(null);
          try {
            queryClient.clear();
          } catch {
            /* swallow cache clear errors */
          }
          resetState();
        },

        // Force-logout escape hatch: clears local state unconditionally
        // without awaiting the server. Use for "log out all devices"
        // flows or when the user explicitly wants to bail out of a
        // broken session (e.g. server unreachable but they need to
        // switch accounts).
        forceLogout: () => {
          setSentryUser(null);
          try {
            queryClient.clear();
          } catch {
            /* swallow cache clear errors */
          }
          resetState();
        },

        // ── Session management ──
        setSession: (partial: Partial<SessionUpdate>) =>
          set((state) => {
            const newRole = partial.role || state.session?.role || "client";
            const context = inferTenantContext();

            return {
              role: newRole as AuthRole,
              user: partial.user !== undefined ? partial.user : state.user,
              userEmail: partial.userEmail !== undefined ? partial.userEmail : state.userEmail,
              token: partial.token !== undefined ? partial.token : state.token,
              isAuthenticated:
                partial.isAuthenticated !== undefined
                  ? partial.isAuthenticated
                  : state.isAuthenticated,
              twoFactorRequired:
                partial.twoFactorRequired !== undefined
                  ? partial.twoFactorRequired
                  : state.twoFactorRequired,
              tenant: partial.tenant !== undefined ? partial.tenant : state.tenant,
              domain: partial.domain !== undefined ? partial.domain : state.domain,
              currentTenant:
                partial.currentTenant !== undefined ? partial.currentTenant : state.currentTenant,
              availableTenants:
                partial.availableTenants !== undefined
                  ? partial.availableTenants
                  : state.availableTenants,
              session: {
                role: newRole as AuthRole,
                tenantSlug:
                  partial.tenant?.slug ||
                  state.session?.tenantSlug ||
                  context.currentTenant?.slug ||
                  null,
                tenantId: partial.tenant?.id?.toString() || state.session?.tenantId || null,
                workspaceRole:
                  partial.workspaceRole !== undefined
                    ? partial.workspaceRole
                    : state.session?.workspaceRole || null,
                abilities: partial.abilities || state.session?.abilities || [],
                cloudRoles: partial.cloudRoles || state.session?.cloudRoles || [],
                cloudAbilities: partial.cloudAbilities || state.session?.cloudAbilities || [],
                permissions: partial.permissions || state.session?.permissions || [],
                expiresAt: state.session?.expiresAt || null,
                isCentralDomain:
                  partial.isCentralDomain !== undefined
                    ? partial.isCentralDomain
                    : (state.session?.isCentralDomain ?? context.isCentralDomain),
                currentDomain:
                  partial.currentDomain !== undefined
                    ? partial.currentDomain
                    : (state.session?.currentDomain ?? context.currentDomain),
              },
            };
          }),

        clearSession: resetState,

        // ── Tenant switching (admin) — H-01 ──
        // Before redirecting to the tenant subdomain, server must
        // confirm the user actually has access. The server endpoint
        // `/auth/switch-tenant` validates the membership and returns
        // success. Only on a 2xx do we redirect.
        //
        // M-08: Also clear the TanStack Query cache before redirecting,
        // so cached per-tenant data from the previous context isn't
        // read by the new tenant.
        switchTenant: async (tenantSlug: string) => {
          if (typeof window === "undefined" || !tenantSlug) return false;
          const safeSlug = tenantSlug.replace(/[^a-zA-Z0-9-]/g, "");
          if (!safeSlug) return false;

          // Server-side authorization check.
          try {
            const config = await import("../config");
            const baseUrl = config.default.baseURL;
            const res = await fetch(`${baseUrl}/auth/switch-tenant`, {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({ tenant_slug: safeSlug }),
            });
            if (!res.ok) {
              ToastUtils.error("You do not have access to that tenant.");
              return false;
            }
          } catch {
            ToastUtils.error(
              "Couldn't verify tenant access. Check your connection and try again."
            );
            return false;
          }

          // Clear namespaced query cache before crossing tenant boundary.
          try {
            queryClient.clear();
          } catch {
            /* swallow */
          }

          const protocol = globalThis.window.location.protocol;
          const port = globalThis.window.location.port
            ? `:${globalThis.window.location.port}`
            : "";
          const targetHost = `${safeSlug}.unicloudafrica.com`;
          globalThis.window.location.href = `${protocol}//${targetHost}${port}`;
          return true;
        },

        // ── Individual setters ──
        setTwoFactorRequired: (value: boolean) => set({ twoFactorRequired: Boolean(value) }),
        clearTwoFactorRequirement: () => set({ twoFactorRequired: false }),
        setUser: (user: User | null) => set({ user }),
        setUserEmail: (email: string | null) => set({ userEmail: email }),
        setAvailableTenants: (tenants: Tenant[]) =>
          set({ availableTenants: Array.isArray(tenants) ? tenants : [] }),
        setHasHydrated,
        clearUserEmail: () => set({ userEmail: null }),
        clearToken: () => {
          /* no-op */
        },
        setRole: (role: string | null) =>
          set((state) => ({
            role: role as AuthRole | null,
            session: state.session
              ? { ...state.session, role: (role || "client") as AuthRole }
              : state.session,
          })),
        setTenant: (tenant: Tenant | null) => set({ tenant }),
        setDomain: (domain: string | null) => set({ domain }),
        setCloudRoles: (roles: string[]) =>
          set((state) => ({
            cloudRoles: roles,
            session: state.session ? { ...state.session, cloudRoles: roles } : state.session,
          })),
        setCloudAbilities: (cloudAbilities: string[]) =>
          set((state) => ({
            cloudAbilities,
            session: state.session ? { ...state.session, cloudAbilities } : state.session,
          })),
        setAbilities: (abilities: string[]) =>
          set((state) => ({
            abilities,
            session: state.session ? { ...state.session, abilities } : state.session,
          })),
        setPermissions: (permissions: string[]) =>
          set((state) => ({
            permissions,
            session: state.session ? { ...state.session, permissions } : state.session,
          })),
        setWorkspaceRole: (workspaceRole: string | null) =>
          set((state) => ({
            workspaceRole,
            session: state.session ? { ...state.session, workspaceRole } : state.session,
          })),
        setCurrentTenant: (tenant: Tenant | null) => set({ currentTenant: tenant }),
        setIsCentralDomain: (value: boolean) =>
          set((state) => ({
            isCentralDomain: value,
            session: state.session ? { ...state.session, isCentralDomain: value } : state.session,
          })),
        setCurrentDomain: (value: string | null) =>
          set((state) => ({
            currentDomain: value,
            session: state.session ? { ...state.session, currentDomain: value } : state.session,
          })),
        updateContext: (context: TenantContext) => {
          set((state) => ({
            currentTenant: context.currentTenant,
            isCentralDomain: context.isCentralDomain,
            currentDomain: context.currentDomain,
            session: state.session
              ? {
                  ...state.session,
                  isCentralDomain: context.isCentralDomain,
                  currentDomain: context.currentDomain,
                }
              : state.session,
          }));
        },

        initializeTenantContext: () => {
          const context = inferTenantContext();
          set({
            currentTenant: context.currentTenant,
          });
          set((state) => {
            if (state.session) {
              return {
                session: {
                  ...state.session,
                  isCentralDomain: context.isCentralDomain,
                  currentDomain: context.currentDomain,
                },
              };
            }
            return {};
          });
        },

        /** @deprecated No-op — auth is cookie-based */
        setToken: (token: string | null) => set({ token }),

        // ── Computed helpers ──
        // Auth is cookie-based (Sanctum SPA) — no Authorization header
        // needed. The browser sends the session cookie automatically
        // when `credentials: "include"` is set on fetch requests.
        getAuthHeaders: () => {
          const { currentTenant, session } = get();
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "application/json",
          };

          // Include tenant slug for non-central domains
          const isCentral = session?.isCentralDomain ?? true;
          const slug = currentTenant?.slug || session?.tenantSlug;
          if (!isCentral && slug) {
            headers["X-Tenant-Slug"] = slug;
          }

          return headers;
        },

        getRole: () => get().session?.role || null,
        /** @deprecated Use getRole() instead */
        getEffectiveRole: () => get().session?.role || null,

        isAdmin: () => get().session?.role === "admin",
        isTenant: () => get().session?.role === "tenant",
        isClient: () => get().session?.role === "client",

        hasPermission: (perm: string) => {
          const perms = get().permissions;
          return perms.includes(perm);
        },
        hasAnyPermission: (perms: string[]) => {
          const userPerms = get().permissions;
          return perms.some((p) => userPerms.includes(p));
        },
        hasAllPermissions: (perms: string[]) => {
          const userPerms = get().permissions;
          return perms.every((p) => userPerms.includes(p));
        },
      };
    },
    {
      name: "unicloud_auth",
      // M-01: Use the safe wrapper so quota-exceeded / disabled storage
      // failures are swallowed instead of crashing the store.
      storage: createJSONStorage(() => safeStorage),
      // H-05: Reduce localStorage footprint. Only keep the bare minimum
      // needed for UX before first render:
      //   - userEmail: for login-form prefill
      //   - lastActiveRole: for initial routing decision
      // Everything else (full user, tenants, session details) must be
      // fetched from `/api/v1/me` on mount via rehydrateFromServer().
      // This reduces XSS blast radius and fixes stale-state bugs.
      partialize: (state) =>
        ({
          userEmail: state.userEmail,
          lastActiveRole: state.session?.role ?? null,
        }) as unknown as UnifiedAuthState,
      onRehydrateStorage: () => () => {
        externalSetHasHydrated?.(true);
      },
    }
  )
);

export default useAuthStore;

// ─── Backward-compatibility aliases ──────────────────────────────────
// These let old code that imported role-specific stores continue working
// during the migration period. They all point to the same unified store.

/** @deprecated Use useAuthStore directly */
export const useAdminAuthStore = useAuthStore;
/** @deprecated Use useAuthStore directly */
export const useTenantAuthStore = useAuthStore;
/** @deprecated Use useAuthStore directly */
export const useClientAuthStore = useAuthStore;
