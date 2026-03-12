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
import { persist } from "zustand/middleware";
import type { User, Tenant, TenantContext } from "../types/auth";

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
  setSession: (partial: Partial<SessionUpdate>) => void;
  clearSession: () => void;
  switchTenant: (tenantSlug: string) => boolean;
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
}

export interface LoginResponse {
  user?: User;
  email?: string;
  role?: AuthRole;
  tenant?: Tenant;
  domain?: string;
  abilities?: string[];
  cloudRoles?: string[];
  cloudAbilities?: string[];
  workspaceRole?: string | null;
  [key: string]: unknown;
}

interface SessionUpdate {
  user: User | null;
  userEmail: string | null;
  role: AuthRole;
  tenant: Tenant | null;
  domain: string | null;
  isAuthenticated: boolean;
  twoFactorRequired: boolean;
  abilities: string[];
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
        login: (response: LoginResponse) => {
          const context = inferTenantContext();
          const role = (response.role as AuthRole) || "client";

          const abilitiesArr = Array.isArray(response.abilities) ? response.abilities : [];
          const cloudRolesArr = Array.isArray(response.cloudRoles) ? response.cloudRoles : [];
          const cloudAbilitiesArr = Array.isArray(response.cloudAbilities)
            ? response.cloudAbilities
            : [];

          set({
            user: response.user || null,
            userEmail: response.email || response.user?.email || null,
            isAuthenticated: true,
            twoFactorRequired: false,
            role,
            token: null,
            abilities: abilitiesArr,
            cloudRoles: cloudRolesArr,
            cloudAbilities: cloudAbilitiesArr,
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
              expiresAt: null,
              isCentralDomain: context.isCentralDomain,
              currentDomain: context.currentDomain,
            },
          });
        },

        // ── Logout ──
        logout: async () => {
          const state = get();
          const role = state.session?.role;

          // Call the server logout endpoint
          try {
            const config = await import("../config");
            const baseUrl =
              role === "admin"
                ? config.default.adminURL
                : role === "tenant"
                  ? config.default.tenantURL
                  : config.default.baseURL;

            await fetch(`${baseUrl}/business/auth/logout`, {
              method: "POST",
              headers: state.getAuthHeaders(),
              credentials: "include",
            });
          } catch {
            // Logout failed silently — still clear local state
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

        // ── Tenant switching (admin) ──
        switchTenant: (tenantSlug: string) => {
          if (typeof window === "undefined" || !tenantSlug) return false;
          const protocol = globalThis.window.location.protocol;
          const port = globalThis.window.location.port ? `:${globalThis.window.location.port}` : "";
          const targetHost = `${tenantSlug}.unicloudafrica.com`;
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
        setToken: () => {
          // Intentional no-op. Auth uses HttpOnly cookies, not client-side tokens.
        },

        // ── Computed helpers ──
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
      };
    },
    {
      name: "unicloud_auth",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) =>
        ({
          user: state.user,
          userEmail: state.userEmail,
          session: state.session,
          role: state.role,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          twoFactorRequired: state.twoFactorRequired,
          cloudRoles: state.cloudRoles,
          cloudAbilities: state.cloudAbilities,
          abilities: state.abilities,
          workspaceRole: state.workspaceRole,
          isCentralDomain: state.isCentralDomain,
          currentDomain: state.currentDomain,
          tenant: state.tenant,
          domain: state.domain,
          currentTenant: state.currentTenant,
          availableTenants: state.availableTenants,
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
