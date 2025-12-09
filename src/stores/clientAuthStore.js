// for clients
import { create } from "zustand";
import { persist } from "zustand/middleware";

let setClientHasHydrated;

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
    (set) => {
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
          set({
            token: newToken,
            isAuthenticated: Boolean(newToken),
          }),
        setSession: (session = {}) =>
          set((state) => ({
            token: session.token ?? state.token,
            userEmail: session.userEmail ?? state.userEmail,
            user: session.user ?? state.user,
            role: session.role ?? state.role,
            tenant: session.tenant ?? state.tenant,
            domain: session.domain ?? state.domain,
            isAuthenticated:
              session.token !== undefined ? Boolean(session.token) : state.isAuthenticated,
            cloudRoles: session.cloudRoles ?? state.cloudRoles,
            cloudAbilities: session.cloudAbilities ?? state.cloudAbilities,
          })),
        clearSession: resetState,
        clearToken: resetState,
        setUserEmail: (newEmail) => set({ userEmail: newEmail }),
        clearUserEmail: () => set({ userEmail: null }),
        setUser: (user) => set({ user }),
        setRole: (role) => set({ role }),
        setHasHydrated,
      };
    },
    {
      name: "unicloud_client_auth", // storage key in localStorage
      getStorage: () => localStorage,
      partialize: (state) => ({
        token: state.token, // Persist the token
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
