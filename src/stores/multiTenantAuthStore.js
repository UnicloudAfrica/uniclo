import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Multi-Tenant Authentication Store
 * Handles authentication across central domain and tenant subdomains
 */
const useMultiTenantAuthStore = create(
  persist(
    (set, get) => ({
      // Core Authentication State
      token: null,
      user: null,
      role: null, // 'admin' | 'tenant' | 'client'
      
      // Multi-Tenant Context
      currentTenant: null, // Current tenant when on subdomain
      isCentralDomain: false, // true for unicloudafrica.com
      currentDomain: null, // Current domain/subdomain
      availableTenants: [], // Tenants user has access to
      
      // Authentication status
      isAuthenticated: false,
      isLoading: false,

      // Initialize tenant context from URL
      initializeTenantContext: () => {
        const hostname = window.location.hostname;
        const isCentral = hostname === 'unicloudafrica.com' || 
                         hostname === 'localhost' || 
                         hostname.includes('127.0.0.1');
        
        let tenantSlug = null;
        if (!isCentral) {
          // Extract tenant from subdomain: tenant.unicloudafrica.com
          tenantSlug = hostname.split('.')[0];
        }

        set({
          isCentralDomain: isCentral,
          currentDomain: hostname,
          currentTenant: isCentral ? null : { slug: tenantSlug }
        });
      },

      // Login with multi-tenant awareness
      login: (authData) => {
        const { token, user, role, tenant, availableTenants = [] } = authData;
        
        set({
          token,
          user,
          role,
          isAuthenticated: true,
          isLoading: false,
          availableTenants,
          // Set current tenant if provided or keep existing
          currentTenant: tenant || get().currentTenant,
        });

        // Store tenant-specific token if on subdomain
        const { currentTenant, isCentralDomain } = get();
        if (!isCentralDomain && currentTenant) {
          localStorage.setItem(`uca_tenant_${currentTenant.slug}_token`, token);
        }
      },

      // Logout with multi-tenant cleanup
      logout: () => {
        const { currentTenant, isCentralDomain } = get();
        
        // Clear tenant-specific storage
        if (!isCentralDomain && currentTenant) {
          localStorage.removeItem(`uca_tenant_${currentTenant.slug}_token`);
        }
        
        // Clear all legacy auth stores
        localStorage.removeItem('unicloud_admin_auth');
        localStorage.removeItem('unicloud_client_auth');
        localStorage.removeItem('unicloud_user_auth');
        
        set({
          token: null,
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
          availableTenants: [],
        });
      },

      // Switch tenant (for admin users)
      switchTenant: (tenantSlug) => {
        if (!get().isAdmin()) {
          console.warn('Only admins can switch tenants');
          return false;
        }

        // Redirect to tenant subdomain
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        const newUrl = `${protocol}//${tenantSlug}.unicloudafrica.com${port}`;
        
        window.location.href = newUrl;
        return true;
      },

      // Role-based permissions (multi-tenant aware)
      isAdmin: () => {
        const { role, isCentralDomain } = get();
        return role === 'admin' && isCentralDomain;
      },

      isTenantAdmin: () => {
        const { role, isCentralDomain } = get();
        return role === 'admin' && !isCentralDomain; // Admin on tenant subdomain
      },

      isTenant: () => {
        const { role } = get();
        return role === 'tenant';
      },

      isClient: () => {
        const { role } = get();
        return role === 'client';
      },

      // Tenant-aware permissions
      canManageGlobalTenants: () => {
        const { role, isCentralDomain } = get();
        return role === 'admin' && isCentralDomain;
      },

      canManageTenantUsers: () => {
        const { role, isCentralDomain } = get();
        return (role === 'admin' || role === 'tenant') && !isCentralDomain;
      },

      canAccessProject: (projectId) => {
        const { role, user, currentTenant } = get();
        
        // Admins can access all projects in their context
        if (role === 'admin') return true;
        
        // Tenants can access projects in their tenant
        if (role === 'tenant' && currentTenant) return true;
        
        // Clients can only access their own projects
        if (role === 'client') {
          return user?.projects?.some(p => p.id === projectId);
        }
        
        return false;
      },

      canProvisionInfrastructure: () => {
        const { role, isCentralDomain } = get();
        // Only tenant/admin users can provision infrastructure
        return ['admin', 'tenant'].includes(role) && !isCentralDomain;
      },

      // API Headers with tenant context
      getAuthHeaders: () => {
        const { token, currentTenant, isCentralDomain } = get();
        const headers = {};
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Add tenant context for API calls
        if (!isCentralDomain && currentTenant) {
          headers['X-Tenant-Slug'] = currentTenant.slug;
        }
        
        return headers;
      },

      // Get appropriate API base URL
      getApiBaseUrl: () => {
        const { isCentralDomain, currentTenant } = get();
        
        if (isCentralDomain) {
          return '/api/v1'; // Central API
        } else if (currentTenant) {
          return '/api/v1'; // Tenant API (same path, different domain)
        }
        
        return '/api/v1';
      },

      // Tenant context helpers
      getCurrentTenantSlug: () => {
        const { currentTenant } = get();
        return currentTenant?.slug || null;
      },

      isOnTenantDomain: () => {
        return !get().isCentralDomain;
      },

      // Migration from old stores with tenant awareness
      migrateFromOldStores: () => {
        try {
          const { currentDomain } = get();
          
          // Try to migrate based on current domain context
          const adminAuth = localStorage.getItem('unicloud_admin_auth');
          const clientAuth = localStorage.getItem('unicloud_client_auth');
          const userAuth = localStorage.getItem('unicloud_user_auth');
          
          // Check for tenant-specific token first
          if (!get().isCentralDomain && get().currentTenant) {
            const tenantToken = localStorage.getItem(`uca_tenant_${get().currentTenant.slug}_token`);
            if (tenantToken) {
              set({
                token: tenantToken,
                isAuthenticated: true,
                role: 'tenant', // Default to tenant role on subdomain
              });
              return true;
            }
          }
          
          // Fallback to old stores
          if (adminAuth && get().isCentralDomain) {
            const data = JSON.parse(adminAuth);
            if (data.token) {
              set({
                token: data.token,
                user: { email: data.userEmail },
                role: 'admin',
                isAuthenticated: true,
              });
              return true;
            }
          }
          
          // Handle client/user auth on tenant domains
          const authToTry = clientAuth || userAuth;
          if (authToTry && !get().isCentralDomain) {
            const data = JSON.parse(authToTry);
            if (data.token) {
              set({
                token: data.token,
                user: { email: data.userEmail },
                role: clientAuth ? 'client' : 'tenant',
                isAuthenticated: true,
              });
              return true;
            }
          }
          
          return false;
        } catch (error) {
          console.error('Migration failed:', error);
          return false;
        }
      },

      // Token validation with tenant context
      validateTokenContext: () => {
        const { token, isCentralDomain, currentTenant, role } = get();
        
        if (!token) return false;
        
        // Validate role matches domain context
        if (isCentralDomain && role !== 'admin') {
          console.warn('Non-admin user on central domain');
          get().logout();
          return false;
        }
        
        if (!isCentralDomain && role === 'admin' && !currentTenant) {
          console.warn('Admin user on tenant domain without tenant context');
          return false;
        }
        
        return true;
      },
    }),
    {
      name: "uca_multi_tenant_auth",
      getStorage: () => localStorage,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        role: state.role,
        currentTenant: state.currentTenant,
        isCentralDomain: state.isCentralDomain,
        currentDomain: state.currentDomain,
        availableTenants: state.availableTenants,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Initialize tenant context
          state.initializeTenantContext();
          
          // Migrate from old stores if needed
          if (!state.isAuthenticated) {
            state.migrateFromOldStores();
          }
          
          // Validate token context
          state.validateTokenContext();
        }
      },
    }
  )
);

// Convenience hooks for different contexts
export const useAuth = () => useMultiTenantAuthStore((state) => ({
  user: state.user,
  role: state.role,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  currentTenant: state.currentTenant,
  isCentralDomain: state.isCentralDomain,
}));

export const useAuthActions = () => useMultiTenantAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  switchTenant: state.switchTenant,
  initializeTenantContext: state.initializeTenantContext,
}));

export const useMultiTenantPermissions = () => useMultiTenantAuthStore((state) => ({
  isAdmin: state.isAdmin,
  isTenantAdmin: state.isTenantAdmin,
  isTenant: state.isTenant,
  isClient: state.isClient,
  canManageGlobalTenants: state.canManageGlobalTenants,
  canManageTenantUsers: state.canManageTenantUsers,
  canAccessProject: state.canAccessProject,
  canProvisionInfrastructure: state.canProvisionInfrastructure,
}));

export const useTenantContext = () => useMultiTenantAuthStore((state) => ({
  currentTenant: state.currentTenant,
  isCentralDomain: state.isCentralDomain,
  getCurrentTenantSlug: state.getCurrentTenantSlug,
  isOnTenantDomain: state.isOnTenantDomain,
  getApiBaseUrl: state.getApiBaseUrl,
  getAuthHeaders: state.getAuthHeaders,
}));

export default useMultiTenantAuthStore;