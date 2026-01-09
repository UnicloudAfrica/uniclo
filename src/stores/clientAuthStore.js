// for clients
import { create } from "zustand";
import { persist } from "zustand/middleware";

let setClientHasHydrated;

const resolveAuthFlag = (session, state) => {
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
  cloudRoles: [],
  cloudAbilities: [],
  hasHydrated: false,
});

const useClientAuthStore = create(
  persist(
    (set, _get) => {
      const setHasHydrated = (value) => set({ hasHydrated: value });
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
        setSession: (session = {}) =>
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
          })),
        clearSession: resetState,
        clearToken: resetState,
        setUserEmail: (newEmail) => set({ userEmail: newEmail }),
        clearUserEmail: () => set({ userEmail: null }),
        setUser: (user) => set({ user }),
        setRole: (role) => set({ role }),
        getAuthHeaders: () => {
          const headers = {
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
      getStorage: () => localStorage,
      partialize: (state) => ({
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
