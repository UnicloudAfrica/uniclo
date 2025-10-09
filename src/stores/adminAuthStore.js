// for admin
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAdminAuthStore = create(
  persist(
    (set) => ({
      token: null,
      userEmail: null,

      // Setters
      setToken: (newToken) => set({ token: newToken }),
      clearToken: () => set({ token: null }),
      setUserEmail: (newEmail) => set({ userEmail: newEmail }),
      clearUserEmail: () => set({ userEmail: null }),
    }),
    {
      name: "unicloud_admin_auth", // storage key in localStorage
      getStorage: () => localStorage,
      partialize: (state) => ({
        token: state.token, // Persist the token
        userEmail: state.userEmail, // Persist the userEmail
      }),
    }
  )
);

export default useAdminAuthStore;
