import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientApi from "../../index/client/api";
import clientSilentApi from "../../index/client/silent";

/**
 * Client Settings Hooks
 * 
 * These hooks handle settings management operations for client context
 * Based on API.md endpoints: /business/settings/*
 * 
 * Endpoints covered:
 * Profile Settings:
 * - GET /business/settings/profile (Get profile settings)
 * - PUT /business/settings/profile (Update profile settings)
 * - PUT /business/settings/profile/batch (Batch update profile settings)
 * - GET /business/settings/profile/schema (Get profile settings schema)
 * - POST /business/settings/profile/reset (Reset profile settings)
 * - GET /business/settings/profile/export (Export profile settings)
 * - POST /business/settings/profile/import (Import profile settings)
 * 
 * Admin Settings (if user has admin role):
 * - GET /business/settings/admin/system (Get system settings)
 * - PUT /business/settings/admin/system (Update system settings)
 * - GET /business/settings/admin/compliance (Get compliance settings)
 * - PUT /business/settings/admin/compliance (Update compliance settings)
 * - GET /business/settings/admin/integrations (Get integration settings)
 * - GET /business/settings/admin/users-overview (Get users settings overview)
 * - GET /business/settings/admin/user/{userId} (Get user settings)
 * - POST /business/settings/admin/user/{userId}/reset (Reset user settings)
 * 
 * Tenant Settings:
 * - GET /business/settings/tenant/business (Get business settings)
 * - PUT /business/settings/tenant/business (Update business settings)
 * - GET /business/settings/tenant/billing (Get billing settings)
 * - PUT /business/settings/tenant/billing (Update billing settings)
 * - GET /business/settings/tenant/branding (Get branding settings)
 * - PUT /business/settings/tenant/branding (Update branding settings)
 * - GET /business/settings/tenant/integrations (Get tenant integrations)
 * - GET /business/settings/tenant/all (Get all tenant settings)
 * - POST /business/settings/tenant/reset (Reset tenant settings)
 */

// ================================
// Profile Settings API Functions
// ================================

// Profile Settings
const fetchClientProfileSettings = async () => {
  const res = await clientSilentApi("GET", "/business/settings/profile");
  if (!res.data) {
    throw new Error("Failed to fetch profile settings");
  }
  return res.data;
};

const updateClientProfileSettings = async (settingsData) => {
  const res = await clientApi("PUT", "/business/settings/profile", settingsData);
  if (!res.data) {
    throw new Error("Failed to update profile settings");
  }
  return res.data;
};

const batchUpdateClientProfileSettings = async (settingsData) => {
  const res = await clientApi("PUT", "/business/settings/profile/batch", settingsData);
  if (!res.data) {
    throw new Error("Failed to batch update profile settings");
  }
  return res.data;
};

const fetchClientProfileSettingsSchema = async () => {
  const res = await clientSilentApi("GET", "/business/settings/profile/schema");
  if (!res.data) {
    throw new Error("Failed to fetch profile settings schema");
  }
  return res.data;
};

const resetClientProfileSettings = async (resetData) => {
  const res = await clientApi("POST", "/business/settings/profile/reset", resetData);
  if (!res.data) {
    throw new Error("Failed to reset profile settings");
  }
  return res.data;
};

const exportClientProfileSettings = async () => {
  const res = await clientSilentApi("GET", "/business/settings/profile/export");
  if (!res.data) {
    throw new Error("Failed to export profile settings");
  }
  return res.data;
};

const importClientProfileSettings = async (importData) => {
  const res = await clientApi("POST", "/business/settings/profile/import", importData);
  if (!res.data) {
    throw new Error("Failed to import profile settings");
  }
  return res.data;
};

// ================================
// Admin Settings API Functions
// ================================

// System Settings
const fetchClientSystemSettings = async () => {
  const res = await clientSilentApi("GET", "/business/settings/admin/system");
  if (!res.data) {
    throw new Error("Failed to fetch system settings");
  }
  return res.data;
};

const updateClientSystemSettings = async (settingsData) => {
  const res = await clientApi("PUT", "/business/settings/admin/system", settingsData);
  if (!res.data) {
    throw new Error("Failed to update system settings");
  }
  return res.data;
};

// Compliance Settings
const fetchClientComplianceSettings = async () => {
  const res = await clientSilentApi("GET", "/business/settings/admin/compliance");
  if (!res.data) {
    throw new Error("Failed to fetch compliance settings");
  }
  return res.data;
};

const updateClientComplianceSettings = async (settingsData) => {
  const res = await clientApi("PUT", "/business/settings/admin/compliance", settingsData);
  if (!res.data) {
    throw new Error("Failed to update compliance settings");
  }
  return res.data;
};

// Integration Settings
const fetchClientIntegrationSettings = async () => {
  const res = await clientSilentApi("GET", "/business/settings/admin/integrations");
  if (!res.data) {
    throw new Error("Failed to fetch integration settings");
  }
  return res.data;
};

// ================================
// Tenant Settings API Functions
// ================================

// Business Settings
const fetchClientTenantBusinessSettings = async () => {
  const res = await clientSilentApi("GET", "/business/settings/tenant/business");
  if (!res.data) {
    throw new Error("Failed to fetch tenant business settings");
  }
  return res.data;
};

const updateClientTenantBusinessSettings = async (settingsData) => {
  const res = await clientApi("PUT", "/business/settings/tenant/business", settingsData);
  if (!res.data) {
    throw new Error("Failed to update tenant business settings");
  }
  return res.data;
};

// Billing Settings
const fetchClientTenantBillingSettings = async () => {
  const res = await clientSilentApi("GET", "/business/settings/tenant/billing");
  if (!res.data) {
    throw new Error("Failed to fetch tenant billing settings");
  }
  return res.data;
};

const updateClientTenantBillingSettings = async (settingsData) => {
  const res = await clientApi("PUT", "/business/settings/tenant/billing", settingsData);
  if (!res.data) {
    throw new Error("Failed to update tenant billing settings");
  }
  return res.data;
};

// Branding Settings
const fetchClientTenantBrandingSettings = async () => {
  const res = await clientSilentApi("GET", "/business/settings/tenant/branding");
  if (!res.data) {
    throw new Error("Failed to fetch tenant branding settings");
  }
  return res.data;
};

const updateClientTenantBrandingSettings = async (settingsData) => {
  const res = await clientApi("PUT", "/business/settings/tenant/branding", settingsData);
  if (!res.data) {
    throw new Error("Failed to update tenant branding settings");
  }
  return res.data;
};

// All Tenant Settings
const fetchClientAllTenantSettings = async () => {
  const res = await clientSilentApi("GET", "/business/settings/tenant/all");
  if (!res.data) {
    throw new Error("Failed to fetch all tenant settings");
  }
  return res.data;
};

const resetClientTenantSettings = async (resetData) => {
  const res = await clientApi("POST", "/business/settings/tenant/reset", resetData);
  if (!res.data) {
    throw new Error("Failed to reset tenant settings");
  }
  return res.data;
};

// ================================
// Profile Settings Hooks
// ================================

export const useFetchClientProfileSettings = (options = {}) => {
  return useQuery({
    queryKey: ["clientProfileSettings"],
    queryFn: fetchClientProfileSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateClientProfileSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientProfileSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientProfileSettings"] });
    },
    onError: (error) => {
      console.error("Error updating profile settings:", error);
    },
  });
};

export const useBatchUpdateClientProfileSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: batchUpdateClientProfileSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientProfileSettings"] });
    },
    onError: (error) => {
      console.error("Error batch updating profile settings:", error);
    },
  });
};

export const useFetchClientProfileSettingsSchema = (options = {}) => {
  return useQuery({
    queryKey: ["clientProfileSettingsSchema"],
    queryFn: fetchClientProfileSettingsSchema,
    staleTime: 1000 * 60 * 30, // 30 minutes - schemas don't change often
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useResetClientProfileSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetClientProfileSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientProfileSettings"] });
    },
    onError: (error) => {
      console.error("Error resetting profile settings:", error);
    },
  });
};

export const useExportClientProfileSettings = () => {
  return useMutation({
    mutationFn: exportClientProfileSettings,
    onError: (error) => {
      console.error("Error exporting profile settings:", error);
    },
  });
};

export const useImportClientProfileSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importClientProfileSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientProfileSettings"] });
    },
    onError: (error) => {
      console.error("Error importing profile settings:", error);
    },
  });
};

// ================================
// Admin Settings Hooks
// ================================

export const useFetchClientSystemSettings = (options = {}) => {
  return useQuery({
    queryKey: ["clientSystemSettings"],
    queryFn: fetchClientSystemSettings,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateClientSystemSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientSystemSettings"] });
    },
    onError: (error) => {
      console.error("Error updating system settings:", error);
    },
  });
};

export const useFetchClientComplianceSettings = (options = {}) => {
  return useQuery({
    queryKey: ["clientComplianceSettings"],
    queryFn: fetchClientComplianceSettings,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateClientComplianceSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientComplianceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientComplianceSettings"] });
    },
    onError: (error) => {
      console.error("Error updating compliance settings:", error);
    },
  });
};

export const useFetchClientIntegrationSettings = (options = {}) => {
  return useQuery({
    queryKey: ["clientIntegrationSettings"],
    queryFn: fetchClientIntegrationSettings,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// ================================
// Tenant Settings Hooks
// ================================

export const useFetchClientTenantBusinessSettings = (options = {}) => {
  return useQuery({
    queryKey: ["clientTenantBusinessSettings"],
    queryFn: fetchClientTenantBusinessSettings,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateClientTenantBusinessSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientTenantBusinessSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientTenantBusinessSettings"] });
      queryClient.invalidateQueries({ queryKey: ["clientAllTenantSettings"] });
    },
    onError: (error) => {
      console.error("Error updating tenant business settings:", error);
    },
  });
};

export const useFetchClientTenantBillingSettings = (options = {}) => {
  return useQuery({
    queryKey: ["clientTenantBillingSettings"],
    queryFn: fetchClientTenantBillingSettings,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateClientTenantBillingSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientTenantBillingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientTenantBillingSettings"] });
      queryClient.invalidateQueries({ queryKey: ["clientAllTenantSettings"] });
    },
    onError: (error) => {
      console.error("Error updating tenant billing settings:", error);
    },
  });
};

export const useFetchClientTenantBrandingSettings = (options = {}) => {
  return useQuery({
    queryKey: ["clientTenantBrandingSettings"],
    queryFn: fetchClientTenantBrandingSettings,
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateClientTenantBrandingSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientTenantBrandingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientTenantBrandingSettings"] });
      queryClient.invalidateQueries({ queryKey: ["clientAllTenantSettings"] });
    },
    onError: (error) => {
      console.error("Error updating tenant branding settings:", error);
    },
  });
};

export const useFetchClientAllTenantSettings = (options = {}) => {
  return useQuery({
    queryKey: ["clientAllTenantSettings"],
    queryFn: fetchClientAllTenantSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useResetClientTenantSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetClientTenantSettings,
    onSuccess: () => {
      // Invalidate all tenant settings queries
      queryClient.invalidateQueries({ queryKey: ["clientAllTenantSettings"] });
      queryClient.invalidateQueries({ queryKey: ["clientTenantBusinessSettings"] });
      queryClient.invalidateQueries({ queryKey: ["clientTenantBillingSettings"] });
      queryClient.invalidateQueries({ queryKey: ["clientTenantBrandingSettings"] });
    },
    onError: (error) => {
      console.error("Error resetting tenant settings:", error);
    },
  });
};