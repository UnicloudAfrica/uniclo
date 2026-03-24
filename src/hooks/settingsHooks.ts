import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";
import adminApi from "../index/admin/api";
import silentAdminApi from "../index/admin/silent";
import adminSettingsApi from "../index/admin/settingsApi";
import silentAdminSettingsApi from "../index/admin/silentSettingsApi";
import clientApi from "../index/client/api";
import tenantApi from "../index/tenant/tenantApi";
import logger from "../utils/logger";

type SettingsPayload = Record<string, unknown>;
type UserId = string | number;
type SettingsFilePayload = FormData | SettingsPayload;
type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
type QueryOptions = Record<string, unknown>;
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type SettingsApiClient = {
  <T = unknown>(method: HttpMethod, uri: string, body?: SettingsFilePayload | null): Promise<T>;
};

type ResetUserSettingsPayload = {
  userId: UserId;
  resetData?: SettingsPayload;
};

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
  const path = globalThis.window.location.pathname;
  if (path.startsWith("/admin-dashboard") || path.startsWith("/admin")) {
    return { api: adminSettingsApi, type: "admin" };
  }
  if (path.startsWith("/dashboard")) {
    return { api: tenantApi, type: "tenant" };
  }
  return { api: clientApi, type: "client" };
};

const requestSettings = async <T>(
  client: SettingsApiClient,
  method: HttpMethod,
  uri: string,
  body?: SettingsFilePayload
) => client<ApiResponse<T>>(method, uri, body ?? null);

const requireData = <T>(res: ApiResponse<T>, message: string): T => {
  if (!res.data) throw new Error(message);
  return res.data;
};

// ================================
// Profile Settings Operations
// ================================

const fetchProfileSettings = async () => {
  const res = await requestSettings(silentAdminSettingsApi, "GET", "/settings/profile");
  return requireData(res, "Failed to fetch profile settings");
};

const updateProfileSettings = async (settingsData: SettingsPayload) => {
  const res = await requestSettings(adminSettingsApi, "PUT", "/settings/profile", settingsData);
  return requireData(res, "Failed to update profile settings");
};

const updateProfileSettingsBatch = async (settingsData: SettingsPayload) => {
  const res = await requestSettings(
    adminSettingsApi,
    "PUT",
    "/settings/profile/batch",
    settingsData
  );
  return requireData(res, "Failed to batch update profile settings");
};

const fetchProfileSettingsSchema = async () => {
  const res = await requestSettings(silentAdminSettingsApi, "GET", "/settings/profile/schema");
  return requireData(res, "Failed to fetch profile settings schema");
};

const resetProfileSettings = async (resetData: SettingsPayload = {}) => {
  const res = await requestSettings(adminSettingsApi, "POST", "/settings/profile/reset", resetData);
  return requireData(res, "Failed to reset profile settings");
};

const exportProfileSettings = async () => {
  const res = await requestSettings(silentAdminSettingsApi, "GET", "/settings/profile/export");
  return requireData(res, "Failed to export profile settings");
};

const importProfileSettings = async (settingsFile: SettingsFilePayload) => {
  const res = await requestSettings(
    adminSettingsApi,
    "POST",
    "/settings/profile/import",
    settingsFile
  );
  return requireData(res, "Failed to import profile settings");
};

// ================================
// Admin Settings Operations
// ================================

const fetchSystemSettings = async () => {
  const res = await requestSettings(silentAdminApi, "GET", "/settings/admin/system");
  return requireData(res, "Failed to fetch system settings");
};

const updateSystemSettings = async (settingsData: SettingsPayload) => {
  const res = await requestSettings(adminApi, "PUT", "/settings/admin/system", settingsData);
  return requireData(res, "Failed to update system settings");
};

const fetchUsersSettingsOverview = async () => {
  const res = await requestSettings(silentAdminApi, "GET", "/settings/admin/users-overview");
  return requireData(res, "Failed to fetch users settings overview");
};

const fetchUserSettings = async (userId: UserId) => {
  const res = await requestSettings(silentAdminApi, "GET", `/settings/admin/user/${userId}`);
  return requireData(res, `Failed to fetch settings for user ${userId}`);
};

const fetchComplianceSettings = async () => {
  const res = await requestSettings(silentAdminApi, "GET", "/settings/admin/compliance");
  return requireData(res, "Failed to fetch compliance settings");
};

const updateComplianceSettings = async (settingsData: SettingsPayload) => {
  const res = await requestSettings(adminApi, "PUT", "/settings/admin/compliance", settingsData);
  return requireData(res, "Failed to update compliance settings");
};

const fetchAdminIntegrationSettings = async () => {
  const res = await requestSettings(silentAdminApi, "GET", "/settings/admin/integrations");
  return requireData(res, "Failed to fetch admin integration settings");
};

const resetUserSettings = async ({ userId, resetData = {} }: ResetUserSettingsPayload) => {
  const res = await requestSettings(
    adminApi,
    "POST",
    `/settings/admin/user/${userId}/reset`,
    resetData
  );
  return requireData(res, `Failed to reset settings for user ${userId}`);
};

// ================================
// Tenant Settings Operations
// ================================

const fetchTenantBusinessSettings = async () => {
  const res = await requestSettings(silentApi, "GET", "/settings/tenant/business");
  return requireData(res, "Failed to fetch tenant business settings");
};

const updateTenantBusinessSettings = async (settingsData: SettingsPayload) => {
  const res = await requestSettings(
    api as unknown as SettingsApiClient,
    "PUT",
    "/settings/tenant/business",
    settingsData
  );
  return requireData(res, "Failed to update tenant business settings");
};

const fetchTenantBillingSettings = async () => {
  const res = await requestSettings(silentApi, "GET", "/settings/tenant/billing");
  return requireData(res, "Failed to fetch tenant billing settings");
};

const updateTenantBillingSettings = async (settingsData: SettingsPayload) => {
  const res = await requestSettings(
    api as unknown as SettingsApiClient,
    "PUT",
    "/settings/tenant/billing",
    settingsData
  );
  return requireData(res, "Failed to update tenant billing settings");
};

const fetchTenantBrandingSettings = async () => {
  const res = await requestSettings(silentApi, "GET", "/business/settings/tenant/branding");
  return requireData(res, "Failed to fetch tenant branding settings");
};

const updateTenantBrandingSettings = async (settingsData: SettingsPayload) => {
  const res = await requestSettings(
    api as unknown as SettingsApiClient,
    "PUT",
    "/business/settings/tenant/branding",
    settingsData
  );
  return requireData(res, "Failed to update tenant branding settings");
};

const fetchTenantIntegrationSettings = async () => {
  const res = await requestSettings(silentApi, "GET", "/business/settings/tenant/integrations");
  return requireData(res, "Failed to fetch tenant integration settings");
};

const fetchAllTenantSettings = async () => {
  const res = await requestSettings(silentApi, "GET", "/business/settings/tenant/all");
  return requireData(res, "Failed to fetch all tenant settings");
};

const resetTenantCategorySettings = async (resetData: SettingsPayload) => {
  const res = await requestSettings(
    api as unknown as SettingsApiClient,
    "POST",
    "/business/settings/tenant/reset",
    resetData
  );
  return requireData(res, "Failed to reset tenant category settings");
};

// ================================
// HOOKS - Profile Settings
// ================================

export const useFetchProfileSettings = (options: QueryOptions = {}) => {
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
    onError: (error: unknown) => {
      logger.error("Error updating profile settings:", error);
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
    onError: (error: unknown) => {
      logger.error("Error batch updating profile settings:", error);
    },
  });
};

export const useFetchProfileSettingsSchema = (options: QueryOptions = {}) => {
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
    onError: (error: unknown) => {
      logger.error("Error resetting profile settings:", error);
    },
  });
};

export const useExportProfileSettings = () => {
  return useMutation({
    mutationFn: exportProfileSettings,
    onError: (error: unknown) => {
      logger.error("Error exporting profile settings:", error);
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
    onError: (error: unknown) => {
      logger.error("Error importing profile settings:", error);
    },
  });
};

// ================================
// HOOKS - Admin Settings
// ================================

export const useFetchSystemSettings = (options: QueryOptions = {}) => {
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
    onError: (error: unknown) => {
      logger.error("Error updating system settings:", error);
    },
  });
};

export const useFetchUsersSettingsOverview = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["users-settings-overview"],
    queryFn: fetchUsersSettingsOverview,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchUserSettings = (userId: UserId, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["user-settings", userId],
    queryFn: () => fetchUserSettings(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchComplianceSettings = (options: QueryOptions = {}) => {
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
    onError: (error: unknown) => {
      logger.error("Error updating compliance settings:", error);
    },
  });
};

export const useFetchAdminIntegrationSettings = (options: QueryOptions = {}) => {
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
    onSuccess: (_data, variables) => {
      void _data;
      queryClient.invalidateQueries({ queryKey: ["user-settings", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users-settings-overview"] });
    },
    onError: (error: unknown) => {
      logger.error("Error resetting user settings:", error);
    },
  });
};

// ================================
// HOOKS - Tenant Settings
// ================================

export const useFetchTenantBusinessSettings = (options: QueryOptions = {}) => {
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
    onError: (error: unknown) => {
      logger.error("Error updating tenant business settings:", error);
    },
  });
};

export const useFetchTenantBillingSettings = (options: QueryOptions = {}) => {
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
    onError: (error: unknown) => {
      logger.error("Error updating tenant billing settings:", error);
    },
  });
};

export const useFetchTenantBrandingSettings = (options: QueryOptions = {}) => {
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
    onError: (error: unknown) => {
      logger.error("Error updating tenant branding settings:", error);
    },
  });
};

export const useFetchTenantIntegrationSettings = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tenant-integration-settings"],
    queryFn: fetchTenantIntegrationSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchAllTenantSettings = (options: QueryOptions = {}) => {
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
    onError: (error: unknown) => {
      logger.error("Error resetting tenant category settings:", error);
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
