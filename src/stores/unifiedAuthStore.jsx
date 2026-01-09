import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Unified Authentication Store - Replaces all separate auth stores
 * Handles: Admin, Client, Tenant, and User authentication in one place
 */
const useUnifiedAuthStore = create(
  persist(
    (set, get) => ({
      // Core Authentication State
      token: null,
      user: null,
      role: null, // 'admin' | 'tenant' | 'client' | 'user'
      tenant: null, // Current tenant context
      isAuthenticated: false,
      isLoading: false,
      cloudRoles: [],
      cloudAbilities: [],

      // Authentication Actions
      login: (authData) => {
        const { user, role, tenant, cloudRoles = [], cloudAbilities = [] } = authData;
        set({
          token: null,
          user,
          role,
          tenant,
          cloudRoles,
          cloudAbilities,
          isAuthenticated: Boolean(user || role),
          isLoading: false,
        });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          role: null,
          tenant: null,
          isAuthenticated: false,
          isLoading: false,
          cloudRoles: [],
          cloudAbilities: [],
        });
      },

      // Role-based Permissions
      hasRole: (requiredRole) => {
        const { role } = get();
        return role === requiredRole;
      },

      hasAnyRole: (roles) => {
        const { role } = get();
        return roles.includes(role);
      },

      isAdmin: () => {
        const { role } = get();
        return role === "admin";
      },

      isTenant: () => {
        const { role } = get();
        return role === "tenant";
      },

      isClient: () => {
        const { role } = get();
        return role === "client";
      },

      // Permission Checks
      canManageUsers: () => {
        const { role } = get();
        return ["admin", "tenant"].includes(role);
      },

      canCreateTenant: () => {
        const { role } = get();
        return role === "admin";
      },

      canCreateClient: () => {
        const { role } = get();
        return ["admin", "tenant"].includes(role);
      },

      canManageProject: (projectId) => {
        const { role, user } = get();
        if (role === "admin") return true;
        if (role === "tenant") return true; // Can manage all projects in their tenant
        if (role === "client") {
          // Client can only manage their own projects
          return user?.projects?.some((p) => p.id === projectId);
        }
        return false;
      },

      // Cloud-role helpers
      hasCloudRole: (cloudRoleKey) => {
        const { cloudRoles } = get();
        return cloudRoles.includes(cloudRoleKey);
      },

      hasAnyCloudRole: (cloudRoleKeys) => {
        const { cloudRoles } = get();
        return cloudRoleKeys.some((role) => cloudRoles.includes(role));
      },

      hasCloudAbility: (abilityKey) => {
        const { cloudAbilities } = get();
        return cloudAbilities.includes(abilityKey);
      },

      hasAnyCloudAbility: (abilityKeys) => {
        const { cloudAbilities } = get();
        return abilityKeys.some((ability) => cloudAbilities.includes(ability));
      },

      // Tenant Context Management
      setTenant: (tenantData) => {
        set({ tenant: tenantData });
      },

      clearTenant: () => {
        set({ tenant: null });
      },

      // Loading States
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // User Profile Updates
      updateUser: (userData) => {
        set((state) => {
          const cloudRoles = userData?.cloud_roles ?? userData?.cloudRoles ?? state.cloudRoles;
          const cloudAbilities =
            userData?.cloud_abilities ?? userData?.cloudAbilities ?? state.cloudAbilities;

          return {
            user: { ...state.user, ...userData },
            cloudRoles: Array.isArray(cloudRoles) ? cloudRoles : state.cloudRoles,
            cloudAbilities: Array.isArray(cloudAbilities) ? cloudAbilities : state.cloudAbilities,
          };
        });
      },

      // Token Management
      setToken: (newToken) => {
        if (newToken) {
          set((state) => ({ token: null, isAuthenticated: state.isAuthenticated }));
        }
      },

      clearToken: () => {
        set((state) => ({ token: null, isAuthenticated: state.isAuthenticated }));
      },

      // Migration Helpers (for transitioning from old stores)
      migrateFromOldStores: () => {
        return false;
      },

      // Utility Functions
      getAuthHeaders: () => {
        // const { token } = get();
        // return token ? { Authorization: `Bearer ${token}` } : {};
        return {}; // HttpOnly cookies handle auth
      },

      isTokenExpired: () => {
        return false;
      },

      // Auto-logout on token expiration
      checkTokenExpiration: () => {
        return true;
      },
    }),
    {
      name: "unicloud_unified_auth", // Single storage key
      getStorage: () => localStorage,
      partialize: (state) => ({
        // token: state.token,
        user: state.user,
        role: state.role,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
        cloudRoles: state.cloudRoles,
        cloudAbilities: state.cloudAbilities,
      }),
      // Run migration on store initialization
      onRehydrateStorage: () => (state) => {
        state?.setToken?.(null);
      },
    }
  )
);

// Export convenience selectors
export const useAuth = () =>
  useUnifiedAuthStore((state) => ({
    user: state.user,
    role: state.role,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    tenant: state.tenant,
    cloudRoles: state.cloudRoles,
    cloudAbilities: state.cloudAbilities,
  }));

export const useAuthActions = () =>
  useUnifiedAuthStore((state) => ({
    login: state.login,
    logout: state.logout,
    setLoading: state.setLoading,
    updateUser: state.updateUser,
    setTenant: state.setTenant,
  }));

export const usePermissions = () =>
  useUnifiedAuthStore((state) => ({
    hasRole: state.hasRole,
    hasAnyRole: state.hasAnyRole,
    isAdmin: state.isAdmin,
    isTenant: state.isTenant,
    isClient: state.isClient,
    canManageUsers: state.canManageUsers,
    canCreateTenant: state.canCreateTenant,
    canCreateClient: state.canCreateClient,
    canManageProject: state.canManageProject,
    hasCloudRole: state.hasCloudRole,
    hasAnyCloudRole: state.hasAnyCloudRole,
    hasCloudAbility: state.hasCloudAbility,
    hasAnyCloudAbility: state.hasAnyCloudAbility,
  }));

export default useUnifiedAuthStore;
