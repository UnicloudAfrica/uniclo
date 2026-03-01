// for clients
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthState } from "../types/auth";

let setClientHasHydrated: (value: boolean) => void;

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

const createInitialState = () => ({
  token: null,
  userEmail: null,
  user: null,
  role: "client",
  tenant: null,
  domain: null,
  isAuthenticated: false,
  twoFactorRequired: false,
  cloudRoles: [],
  cloudAbilities: [],
  currentTenant: null,
  isCentralDomain: true,
  currentDomain: null,
  hasHydrated: false,
});

const useClientAuthStore = create<AuthState>()(
  persist(
    (set, _get) => {
      const setHasHydrated = (value: boolean) => set({ hasHydrated: value });
      setClientHasHydrated = setHasHydrated;

      const resetState = () =>
        set((state) => ({
          ...createInitialState(),
          hasHydrated: state.hasHydrated,
        }));

      return {
        ...createInitialState(),

        setToken: (newToken) =>
          set((state) => ({
            token: null,
            isAuthenticated:
              Boolean(newToken) ||
              state.isAuthenticated ||
              Boolean(state.user) ||
              Boolean(state.userEmail),
          })),
        setSession: (session: Partial<AuthState> = {}) =>
          set((state) => ({
            token: null,
            userEmail: session.userEmail ?? state.userEmail,
            user: session.user ?? state.user,
            role: session.role ?? state.role,
            tenant: session.tenant ?? state.tenant,
            domain: session.domain ?? state.domain,
            isAuthenticated: resolveAuthFlag(session, state),
            cloudRoles: session.cloudRoles ?? state.cloudRoles,
            cloudAbilities: session.cloudAbilities ?? state.cloudAbilities,
            currentTenant: session.currentTenant ?? state.currentTenant,
            isCentralDomain: session.isCentralDomain ?? state.isCentralDomain,
            currentDomain: session.currentDomain ?? state.currentDomain,
            twoFactorRequired: session.twoFactorRequired ?? state.twoFactorRequired,
          })),
        clearSession: resetState,
        clearToken: resetState,
        setUserEmail: (newEmail) => set({ userEmail: newEmail }),
        clearUserEmail: () => set({ userEmail: null }),
        setTwoFactorRequired: (value) => set({ twoFactorRequired: Boolean(value) }),
        clearTwoFactorRequirement: () => set({ twoFactorRequired: false }),
        setUser: (user) => set({ user }),
        setRole: (role) => set({ role }),
        setTenant: (tenant) => set({ tenant }),
        setCloudRoles: (roles: string[] = []) => set({ cloudRoles: roles }),
        setCloudAbilities: (abilities: string[] = []) => set({ cloudAbilities: abilities }),
        setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
        getAuthHeaders: () => {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "application/json",
          };
          return headers;
        },
        setHasHydrated,
      };
    },
    {
      name: "unicloud_client_auth", // storage key in localStorage
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
        // token: state.token, // Persist the token
        userEmail: state.userEmail, // Persist the userEmail
        user: state.user,
        role: state.role,
        tenant: state.tenant,
        domain: state.domain,
        isAuthenticated: state.isAuthenticated,
        cloudRoles: state.cloudRoles,
        cloudAbilities: state.cloudAbilities,
      }),
      onRehydrateStorage: () => () => {
        setClientHasHydrated?.(true);
      },
    }
  )
);

export default useClientAuthStore;
