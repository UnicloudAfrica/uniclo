// for tenants
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthState, TenantContext } from "../types/auth";

let setTenantHasHydrated: (value: boolean) => void;

const inferTenantContext = (): TenantContext => {
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

const baseContext = inferTenantContext();

const resolveAuthFlag = (session: Partial<AuthState>, state: AuthState): boolean => {
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

const createInitialState = (context: TenantContext = baseContext) => ({
  token: null,
  userEmail: null,
  user: null,
  role: "tenant",
  tenant: null,
  domain: null,
  isAuthenticated: false,
  twoFactorRequired: false,
  cloudRoles: [],
  cloudAbilities: [],
  currentTenant: context.currentTenant,
  isCentralDomain: context.isCentralDomain,
  currentDomain: context.currentDomain,
  hasHydrated: false,
});

const useTenantAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const setHasHydrated = (value: boolean) => set({ hasHydrated: value });
      setTenantHasHydrated = setHasHydrated;

      const resetState = () => {
        const context = inferTenantContext();
        set((state) => ({
          ...createInitialState(context),
          hasHydrated: state.hasHydrated,
        }));
      };

      return {
        ...createInitialState(),

        // Setters
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
        setDomain: (domain: string | null) => set({ domain }),
        setCurrentTenant: (currentTenant) => set({ currentTenant }),
        setIsCentralDomain: (value: boolean) => set({ isCentralDomain: value }),
        setCurrentDomain: (value: string) => set({ currentDomain: value }),
        setCloudRoles: (roles: string[] = []) => set({ cloudRoles: roles }),
        setCloudAbilities: (abilities: string[] = []) => set({ cloudAbilities: abilities }),
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
            currentTenant: session.currentTenant ?? state.currentTenant,
            isCentralDomain: session.isCentralDomain ?? state.isCentralDomain,
            currentDomain: session.currentDomain ?? state.currentDomain,
          })),
        clearSession: resetState,
        getAuthHeaders: () => {
          const { currentTenant, isCentralDomain } = get();
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "application/json",
          };
          if (!isCentralDomain && currentTenant?.slug) {
            headers["X-Tenant-Slug"] = currentTenant.slug;
          }
          return headers;
        },
        setHasHydrated,
      };
    },
    {
      name: "unicloud_tenant_auth", // storage key in localStorage
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
      partialize: (state: AuthState): Partial<AuthState> => ({
        // token: state.token,
        userEmail: state.userEmail,
        user: state.user,
        role: state.role,
        tenant: state.tenant,
        domain: state.domain,
        isAuthenticated: state.isAuthenticated,
        twoFactorRequired: state.twoFactorRequired,
        cloudRoles: state.cloudRoles,
        cloudAbilities: state.cloudAbilities,
        currentTenant: state.currentTenant,
        isCentralDomain: state.isCentralDomain,
        currentDomain: state.currentDomain,
      }),
      onRehydrateStorage: () => () => {
        setTenantHasHydrated?.(true);
      },
    }
  )
);

export default useTenantAuthStore;
