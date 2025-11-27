// for admin
import { create } from "zustand";
import { persist } from "zustand/middleware";

const inferTenantContext = () => {
  if (typeof window === "undefined") {
    return {
      isCentralDomain: true,
      currentDomain: "localhost",
      currentTenant: null,
    };
  }

  const hostname = window.location.hostname;
  const isCentral =
    hostname === "unicloudafrica.com" ||
    hostname === "localhost" ||
    hostname.includes("127.0.0.1");
  const tenantSlug = !isCentral ? hostname.split(".")[0] : null;

  return {
    isCentralDomain: isCentral,
    currentDomain: hostname,
    currentTenant: tenantSlug ? { slug: tenantSlug } : null,
  };
};

const baseContext = inferTenantContext();

const createInitialState = (context = baseContext) => ({
  token: null,
  userEmail: null,
  user: null,
  role: "admin",
  tenant: null,
  domain: null,
  isAuthenticated: false,
  cloudRoles: [],
  cloudAbilities: [],
  currentTenant: context.currentTenant,
  isCentralDomain: context.isCentralDomain,
  currentDomain: context.currentDomain,
  availableTenants: [],
  hasHydrated: false,
});

let setAdminHasHydrated;

const useAdminAuthStore = create(
  persist(
    (set, get) => {
      const setHasHydrated = (value) => set({ hasHydrated: value });
      setAdminHasHydrated = setHasHydrated;

      const resetState = () => {
        const context = inferTenantContext();
        set({
          ...createInitialState(context),
          hasHydrated: get().hasHydrated,
        });
      };

      const updateContext = (context) => {
        set({
          currentTenant: context.currentTenant,
          isCentralDomain: context.isCentralDomain,
          currentDomain: context.currentDomain,
        });
      };

      return {
        ...createInitialState(),

        setToken: (newToken) =>
          set({
            token: newToken,
            isAuthenticated: Boolean(newToken),
          }),
        clearToken: resetState,
        setUserEmail: (newEmail) => set({ userEmail: newEmail }),
        clearUserEmail: () => set({ userEmail: null }),
        setUser: (user) => set({ user }),
        setRole: (role) => set({ role }),
        setTenant: (tenant) => set({ tenant }),
        setCloudRoles: (roles = []) =>
          set({ cloudRoles: Array.isArray(roles) ? roles : [] }),
        setCloudAbilities: (abilities = []) =>
          set({ cloudAbilities: Array.isArray(abilities) ? abilities : [] }),
        setAvailableTenants: (tenants = []) =>
          set({ availableTenants: Array.isArray(tenants) ? tenants : [] }),
        setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
        setSession: (session = {}) =>
          set((state) => ({
            token: session.token ?? state.token,
            userEmail: session.userEmail ?? state.userEmail,
            user: session.user ?? state.user,
            role: session.role ?? state.role,
            tenant: session.tenant ?? state.tenant,
            domain: session.domain ?? state.domain,
            isAuthenticated:
              session.token !== undefined
                ? Boolean(session.token)
                : state.isAuthenticated,
            cloudRoles: session.cloudRoles ?? state.cloudRoles,
            cloudAbilities: session.cloudAbilities ?? state.cloudAbilities,
            currentTenant: session.currentTenant ?? state.currentTenant,
            isCentralDomain:
              session.isCentralDomain ?? state.isCentralDomain,
            currentDomain: session.currentDomain ?? state.currentDomain,
            availableTenants:
              session.availableTenants ?? state.availableTenants,
          })),
        clearSession: resetState,
        initializeTenantContext: () => {
          updateContext(inferTenantContext());
        },
        switchTenant: (tenantSlug) => {
          if (typeof window === "undefined" || !tenantSlug) {
            return false;
          }
          const protocol = window.location.protocol;
          const port = window.location.port ? `:${window.location.port}` : "";
          const targetHost = `${tenantSlug}.unicloudafrica.com`;
          window.location.href = `${protocol}//${targetHost}${port}`;
          return true;
        },
        getAuthHeaders: () => {
          const { token, currentTenant, isCentralDomain } = get();
          const headers = {
            "Content-Type": "application/json",
            Accept: "application/json",
          };
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          if (!isCentralDomain && currentTenant?.slug) {
            headers["X-Tenant-Slug"] = currentTenant.slug;
          }
          return headers;
        },
        getEffectiveRole: () => {
          const { role, isCentralDomain } = get();
          if (role) return role;
          return isCentralDomain ? "admin" : "tenant";
        },
        updateContext,
        setHasHydrated,
      };
    },
    {
      name: "unicloud_admin_auth", // storage key in localStorage
      getStorage: () => localStorage,
     partialize: (state) => ({
       token: state.token,
       userEmail: state.userEmail,
       user: state.user,
       role: state.role,
       tenant: state.tenant,
        domain: state.domain,
       isAuthenticated: state.isAuthenticated,
        cloudRoles: state.cloudRoles,
        cloudAbilities: state.cloudAbilities,
        currentTenant: state.currentTenant,
        isCentralDomain: state.isCentralDomain,
        currentDomain: state.currentDomain,
        availableTenants: state.availableTenants,
      }),
      onRehydrateStorage: () => () => {
        setAdminHasHydrated?.(true);
      },
    }
  )
);

export default useAdminAuthStore;
