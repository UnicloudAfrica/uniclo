import { create, type StoreApi } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, Tenant, TenantContext } from "../types/auth";

// ─── Shared helpers ────────────────────────────────────────────────

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

export const resolveAuthFlag = (session: Partial<AuthState>, state: AuthState): boolean => {
  if (typeof session.isAuthenticated === "boolean") {
    return session.isAuthenticated;
  }
  if (session.user !== undefined) {
    return Boolean(session.user);
  }
  if (session.userEmail !== undefined) {
    return Boolean(session.userEmail);
  }
  if (session.role !== undefined) {
    return Boolean(session.role);
  }
  return state.isAuthenticated;
};

// ─── Factory config ────────────────────────────────────────────────

type SetFn = StoreApi<AuthState>["setState"];
type GetFn = StoreApi<AuthState>["getState"];

export interface AuthStoreFactoryConfig {
  /** Default role written into initial state */
  defaultRole: "admin" | "tenant" | "client";
  /** localStorage key used by the persist middleware */
  storageKey: string;
  /** Whether to derive initial tenant context from the hostname */
  useTenantContext: boolean;
  /** Role-specific methods merged into the store */
  extraMethods?: (
    set: SetFn,
    get: GetFn,
    helpers: { inferTenantContext: typeof inferTenantContext }
  ) => Record<string, unknown>;
  /** Override the default getAuthHeaders implementation */
  getAuthHeaders?: (get: GetFn) => Record<string, string>;
  /** Additional state keys to include in partialize (persisted to localStorage) */
  extraPartializeFields?: (keyof AuthState)[];
}

// ─── Factory function ──────────────────────────────────────────────

export function createAuthStoreFactory(config: AuthStoreFactoryConfig) {
  const {
    defaultRole,
    storageKey,
    useTenantContext,
    extraMethods,
    getAuthHeaders: customGetAuthHeaders,
    extraPartializeFields = [],
  } = config;

  const baseContext: TenantContext = useTenantContext
    ? inferTenantContext()
    : { isCentralDomain: true, currentDomain: null, currentTenant: null };

  const createInitialState = (context: TenantContext = baseContext) => ({
    token: null,
    userEmail: null,
    user: null,
    role: defaultRole as string,
    tenant: null,
    domain: null,
    isAuthenticated: false,
    twoFactorRequired: false,
    cloudRoles: [] as string[],
    cloudAbilities: [] as string[],
    abilities: [] as string[],
    workspaceRole: null as string | null,
    currentTenant: context.currentTenant,
    isCentralDomain: context.isCentralDomain,
    currentDomain: context.currentDomain,
    availableTenants: [] as Tenant[],
    hasHydrated: false,
  });

  // Closure variable so onRehydrateStorage can call it after the store is created
  let externalSetHasHydrated: ((value: boolean) => void) | undefined;

  // Base partialize fields (shared by all stores)
  const basePartializeFields: (keyof AuthState)[] = [
    "userEmail",
    "user",
    "role",
    "tenant",
    "domain",
    "isAuthenticated",
    "cloudRoles",
    "cloudAbilities",
    "abilities",
    "workspaceRole",
    "twoFactorRequired",
  ];

  const allPartializeFields = [...basePartializeFields, ...extraPartializeFields];

  const store = create<AuthState>()(
    persist(
      (set, get) => {
        const setHasHydrated = (value: boolean) => set({ hasHydrated: value });
        externalSetHasHydrated = setHasHydrated;

        const resetState = () => {
          const context = useTenantContext ? inferTenantContext() : baseContext;
          set((state) => ({
            ...createInitialState(context),
            hasHydrated: state.hasHydrated,
          }));
        };

        // Default getAuthHeaders uses tenant slug when not on central domain
        const defaultGetAuthHeaders = (): Record<string, string> => {
          const { currentTenant, isCentralDomain } = get();
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "application/json",
          };
          if (!isCentralDomain && currentTenant?.slug) {
            headers["X-Tenant-Slug"] = currentTenant.slug;
          }
          return headers;
        };

        // Build extra methods (role-specific)
        const extras = extraMethods ? extraMethods(set, get, { inferTenantContext }) : {};

        return {
          ...createInitialState(),

          // ── Common setters ───────────────────────────────────
          setToken: (newToken) =>
            set((state) => ({
              token: null,
              isAuthenticated:
                Boolean(newToken) ||
                state.isAuthenticated ||
                Boolean(state.user) ||
                Boolean(state.userEmail),
            })),
          clearToken: resetState,
          setUserEmail: (newEmail) => set({ userEmail: newEmail }),
          clearUserEmail: () => set({ userEmail: null }),
          setTwoFactorRequired: (value) => set({ twoFactorRequired: Boolean(value) }),
          clearTwoFactorRequirement: () => set({ twoFactorRequired: false }),
          setUser: (user) => set({ user }),
          setRole: (role) => set({ role }),
          setTenant: (tenant) => set({ tenant }),
          setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
          setCloudRoles: (roles: string[] = []) =>
            set({ cloudRoles: Array.isArray(roles) ? roles : [] }),
          setCloudAbilities: (abilities: string[] = []) =>
            set({ cloudAbilities: Array.isArray(abilities) ? abilities : [] }),
          setAbilities: (abilities: string[] = []) =>
            set({ abilities: Array.isArray(abilities) ? abilities : [] }),
          setWorkspaceRole: (role: string | null) => set({ workspaceRole: role }),

          // ── Session management ───────────────────────────────
          setSession: (session: Partial<AuthState> = {}) =>
            set((state) => ({
              token: null,
              userEmail: session.userEmail ?? state.userEmail,
              user: session.user ?? state.user,
              role: session.role ?? state.role,
              tenant: session.tenant ?? state.tenant,
              domain: session.domain ?? state.domain,
              isAuthenticated: resolveAuthFlag(session, state),
              twoFactorRequired: session.twoFactorRequired ?? state.twoFactorRequired,
              cloudRoles: session.cloudRoles ?? state.cloudRoles,
              cloudAbilities: session.cloudAbilities ?? state.cloudAbilities,
              abilities: session.abilities ?? state.abilities,
              workspaceRole: session.workspaceRole ?? state.workspaceRole,
              currentTenant: session.currentTenant ?? state.currentTenant,
              isCentralDomain: session.isCentralDomain ?? state.isCentralDomain,
              currentDomain: session.currentDomain ?? state.currentDomain,
              ...(defaultRole === "admin"
                ? {
                    availableTenants: session.availableTenants ?? state.availableTenants,
                  }
                : {}),
            })),
          clearSession: resetState,

          // ── Auth headers ─────────────────────────────────────
          getAuthHeaders: customGetAuthHeaders
            ? () => customGetAuthHeaders(get)
            : defaultGetAuthHeaders,

          setHasHydrated,

          // ── Role-specific extras ─────────────────────────────
          ...extras,
        } as AuthState;
      },
      {
        name: storageKey,
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
        partialize: (state: AuthState): Partial<AuthState> => {
          const result: Partial<AuthState> = {};
          for (const key of allPartializeFields) {
            if (key in state) {
              (result as Record<string, unknown>)[key as string] = state[key as keyof AuthState];
            }
          }
          return result;
        },
        onRehydrateStorage: () => () => {
          externalSetHasHydrated?.(true);
        },
      }
    )
  );

  return store;
}
