import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";
import adminApi from "../index/admin/api";
import silentAdminApi from "../index/admin/silent";
import adminSettingsApi from "../index/admin/settingsApi";
import silentAdminSettingsApi from "../index/admin/silentSettingsApi";
import clientApi from "../index/client/api";
import tenantApi from "../index/tenant/tenantApi";

/**
 * Settings Management Hooks
 *
 * These hooks provide comprehensive settings management functionality including:
 * - Profile Settings (All users)
 * - Admin Settings (Admin only)
 * - Tenant Settings (Admin and Tenant users)
 * - Settings import/export functionality
 * - Settings schema and validation
 */

export const detectApiContext = () => {
  const path = window.location.pathname;
  if (path.startsWith("/admin-dashboard") || path.startsWith("/admin")) {
    return { api: adminSettingsApi, type: "admin" };
  }
  if (path.startsWith("/dashboard")) {
    return { api: tenantApi, type: "tenant" };
  }
  return { api: clientApi, type: "client" };
};

// ================================
// Profile Settings Operations
// ================================

const fetchProfileSettings = async () => {
  const res = await silentAdminSettingsApi("GET", "/settings/profile");
  if (!res.data) throw new Error("Failed to fetch profile settings");
  return res.data;
};

const updateProfileSettings = async (settingsData) => {
  const res = await adminSettingsApi("PUT", "/settings/profile", settingsData);
  if (!res.data) throw new Error("Failed to update profile settings");
  return res.data;
};

const updateProfileSettingsBatch = async (settingsData) => {
  const res = await adminSettingsApi("PUT", "/settings/profile/batch", settingsData);
  if (!res.data) throw new Error("Failed to batch update profile settings");
  return res.data;
};

const fetchProfileSettingsSchema = async () => {
  const res = await silentAdminSettingsApi("GET", "/settings/profile/schema");
  if (!res.data) throw new Error("Failed to fetch profile settings schema");
  return res.data;
};

const resetProfileSettings = async (resetData = {}) => {
  const res = await adminSettingsApi("POST", "/settings/profile/reset", resetData);
  if (!res.data) throw new Error("Failed to reset profile settings");
  return res.data;
};

const exportProfileSettings = async () => {
  const res = await silentAdminSettingsApi("GET", "/settings/profile/export");
  if (!res.data) throw new Error("Failed to export profile settings");
  return res.data;
};

const importProfileSettings = async (settingsFile) => {
  const res = await adminSettingsApi("POST", "/settings/profile/import", settingsFile);
  if (!res.data) throw new Error("Failed to import profile settings");
  return res.data;
};

// ================================
// Admin Settings Operations
// ================================

const fetchSystemSettings = async () => {
  const res = await silentAdminApi("GET", "/settings/admin/system");
  if (!res.data) throw new Error("Failed to fetch system settings");
  return res.data;
};

const updateSystemSettings = async (settingsData) => {
  const res = await adminApi("PUT", "/settings/admin/system", settingsData);
  if (!res.data) throw new Error("Failed to update system settings");
  return res.data;
};

const fetchUsersSettingsOverview = async () => {
  const res = await silentAdminApi("GET", "/settings/admin/users-overview");
  if (!res.data) throw new Error("Failed to fetch users settings overview");
  return res.data;
};

const fetchUserSettings = async (userId) => {
  const res = await silentAdminApi("GET", `/settings/admin/user/${userId}`);
  if (!res.data) throw new Error(`Failed to fetch settings for user ${userId}`);
  return res.data;
};

const fetchComplianceSettings = async () => {
  const res = await silentAdminApi("GET", "/settings/admin/compliance");
  if (!res.data) throw new Error("Failed to fetch compliance settings");
  return res.data;
};

const updateComplianceSettings = async (settingsData) => {
  const res = await adminApi("PUT", "/settings/admin/compliance", settingsData);
  if (!res.data) throw new Error("Failed to update compliance settings");
  return res.data;
};

const fetchAdminIntegrationSettings = async () => {
  const res = await silentAdminApi("GET", "/settings/admin/integrations");
  if (!res.data) throw new Error("Failed to fetch admin integration settings");
  return res.data;
};

const resetUserSettings = async ({ userId, resetData = {} }) => {
  const res = await adminApi("POST", `/settings/admin/user/${userId}/reset`, resetData);
  if (!res.data) throw new Error(`Failed to reset settings for user ${userId}`);
  return res.data;
};

// ================================
// Tenant Settings Operations
// ================================

const fetchTenantBusinessSettings = async () => {
  const res = await silentApi("GET", "/business/settings/tenant/business");
  if (!res.data) throw new Error("Failed to fetch tenant business settings");
  return res.data;
};

const updateTenantBusinessSettings = async (settingsData) => {
  const res = await api("PUT", "/business/settings/tenant/business", settingsData);
  if (!res.data) throw new Error("Failed to update tenant business settings");
  return res.data;
};

const fetchTenantBillingSettings = async () => {
  const res = await silentApi("GET", "/business/settings/tenant/billing");
  if (!res.data) throw new Error("Failed to fetch tenant billing settings");
  return res.data;
};

const updateTenantBillingSettings = async (settingsData) => {
  const res = await api("PUT", "/business/settings/tenant/billing", settingsData);
  if (!res.data) throw new Error("Failed to update tenant billing settings");
  return res.data;
};

const fetchTenantBrandingSettings = async () => {
  const res = await silentApi("GET", "/business/settings/tenant/branding");
  if (!res.data) throw new Error("Failed to fetch tenant branding settings");
  return res.data;
};

const updateTenantBrandingSettings = async (settingsData) => {
  const res = await api("PUT", "/business/settings/tenant/branding", settingsData);
  if (!res.data) throw new Error("Failed to update tenant branding settings");
  return res.data;
};

const fetchTenantIntegrationSettings = async () => {
  const res = await silentApi("GET", "/business/settings/tenant/integrations");
  if (!res.data) throw new Error("Failed to fetch tenant integration settings");
  return res.data;
};

const fetchAllTenantSettings = async () => {
  const res = await silentApi("GET", "/business/settings/tenant/all");
  if (!res.data) throw new Error("Failed to fetch all tenant settings");
  return res.data;
};

const resetTenantCategorySettings = async (resetData) => {
  const res = await api("POST", "/business/settings/tenant/reset", resetData);
  if (!res.data) throw new Error("Failed to reset tenant category settings");
  return res.data;
};

// ================================
// HOOKS - Profile Settings
// ================================

export const useFetchProfileSettings = (options = {}) => {
  return useQuery({
    queryKey: ["profile-settings"],
    queryFn: fetchProfileSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateProfileSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfileSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
    },
    onError: (error) => {
      console.error("Error updating profile settings:", error);
    },
  });
};

export const useUpdateProfileSettingsBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfileSettingsBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
    },
    onError: (error) => {
      console.error("Error batch updating profile settings:", error);
    },
  });
};

export const useFetchProfileSettingsSchema = (options = {}) => {
  return useQuery({
    queryKey: ["profile-settings-schema"],
    queryFn: fetchProfileSettingsSchema,
    staleTime: 1000 * 60 * 30, // Cache longer since schema changes less frequently
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useResetProfileSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetProfileSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
    },
    onError: (error) => {
      console.error("Error resetting profile settings:", error);
    },
  });
};

export const useExportProfileSettings = () => {
  return useMutation({
    mutationFn: exportProfileSettings,
    onError: (error) => {
      console.error("Error exporting profile settings:", error);
    },
  });
};

export const useImportProfileSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importProfileSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
    },
    onError: (error) => {
      console.error("Error importing profile settings:", error);
    },
  });
};

// ================================
// HOOKS - Admin Settings
// ================================

export const useFetchSystemSettings = (options = {}) => {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: fetchSystemSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (error) => {
      console.error("Error updating system settings:", error);
    },
  });
};

export const useFetchUsersSettingsOverview = (options = {}) => {
  return useQuery({
    queryKey: ["users-settings-overview"],
    queryFn: fetchUsersSettingsOverview,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchUserSettings = (userId, options = {}) => {
  return useQuery({
    queryKey: ["user-settings", userId],
    queryFn: () => fetchUserSettings(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchComplianceSettings = (options = {}) => {
  return useQuery({
    queryKey: ["compliance-settings"],
    queryFn: fetchComplianceSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateComplianceSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateComplianceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-settings"] });
    },
    onError: (error) => {
      console.error("Error updating compliance settings:", error);
    },
  });
};

export const useFetchAdminIntegrationSettings = (options = {}) => {
  return useQuery({
    queryKey: ["admin-integration-settings"],
    queryFn: fetchAdminIntegrationSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useResetUserSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetUserSettings,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-settings", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users-settings-overview"] });
    },
    onError: (error) => {
      console.error("Error resetting user settings:", error);
    },
  });
};

// ================================
// HOOKS - Tenant Settings
// ================================

export const useFetchTenantBusinessSettings = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-business-settings"],
    queryFn: fetchTenantBusinessSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateTenantBusinessSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantBusinessSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-business-settings"] });
      queryClient.invalidateQueries({ queryKey: ["all-tenant-settings"] });
    },
    onError: (error) => {
      console.error("Error updating tenant business settings:", error);
    },
  });
};

export const useFetchTenantBillingSettings = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-billing-settings"],
    queryFn: fetchTenantBillingSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateTenantBillingSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantBillingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-billing-settings"] });
      queryClient.invalidateQueries({ queryKey: ["all-tenant-settings"] });
    },
    onError: (error) => {
      console.error("Error updating tenant billing settings:", error);
    },
  });
};

export const useFetchTenantBrandingSettings = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-branding-settings"],
    queryFn: fetchTenantBrandingSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateTenantBrandingSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantBrandingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-branding-settings"] });
      queryClient.invalidateQueries({ queryKey: ["all-tenant-settings"] });
    },
    onError: (error) => {
      console.error("Error updating tenant branding settings:", error);
    },
  });
};

export const useFetchTenantIntegrationSettings = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-integration-settings"],
    queryFn: fetchTenantIntegrationSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchAllTenantSettings = (options = {}) => {
  return useQuery({
    queryKey: ["all-tenant-settings"],
    queryFn: fetchAllTenantSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useResetTenantCategorySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetTenantCategorySettings,
    onSuccess: () => {
      // Invalidate all tenant settings queries
      queryClient.invalidateQueries({ queryKey: ["tenant-business-settings"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-billing-settings"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-branding-settings"] });
      queryClient.invalidateQueries({ queryKey: ["all-tenant-settings"] });
    },
    onError: (error) => {
      console.error("Error resetting tenant category settings:", error);
    },
  });
};

// ================================
// Combined Settings Hook
// ================================

// Hook that provides access to all settings operations based on user role
export const useSettingsOperations = () => {
  const queryClient = useQueryClient();

  const invalidateAllSettings = () => {
    queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
    queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    queryClient.invalidateQueries({ queryKey: ["all-tenant-settings"] });
  };

  return {
    // Profile settings
    profileSettings: useFetchProfileSettings(),
    updateProfileSettings: useUpdateProfileSettings(),
    resetProfileSettings: useResetProfileSettings(),

    // Admin settings (if admin)
    systemSettings: useFetchSystemSettings(),
    updateSystemSettings: useUpdateSystemSettings(),

    // Tenant settings (if admin or tenant)
    tenantSettings: useFetchAllTenantSettings(),
    updateTenantBusinessSettings: useUpdateTenantBusinessSettings(),

    // Utility functions
    invalidateAllSettings,
  };
};

// Export individual functions for direct use if needed
export {
  fetchProfileSettings,
  updateProfileSettings,
  fetchSystemSettings,
  updateSystemSettings,
  fetchAllTenantSettings,
  updateTenantBusinessSettings,
  resetProfileSettings,
  resetUserSettings,
  resetTenantCategorySettings,
};
