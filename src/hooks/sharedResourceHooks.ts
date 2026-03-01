import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientApi from "../index/client/api";
import clientSilentApi from "../index/client/silent";
import adminApi from "../index/admin/api";
import silentAdminApi from "../index/admin/silent";
import tenantApi from "../index/tenant/tenantApi";
import silentTenantApi from "../index/tenant/silentTenant";
import { type HttpMethod } from "../index/api";
import config from "../config";
import useAdminAuthStore from "../stores/adminAuthStore";

// --- Interfaces ---

export interface Country {
  name: string;
  code: string;
  phone_code?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export type ApiClient = <T = unknown>(
  method: HttpMethod,
  url: string,
  data?: unknown
) => Promise<ApiResponse<T>>;

/**
 * Shared Resource Hooks
 *
 * These hooks are shared across Admin, Tenant, and Client contexts
 * as defined in shared_resources.php. They use different API clients
 * based on the context they're called from.
 */

// ================================
// COUNTRIES (Shared across all contexts via /api/v1)
// ================================

const fetchCountries = async (): Promise<Country[]> => {
  // Countries endpoint should not require authentication
  // Use direct fetch to avoid auth store complications
  const baseURL = (import.meta.env["VITE_API_USER_BASE_URL"] as string) || "";
  const url = `${baseURL}/api/v1/countries`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const res: ApiResponse<Country[]> = await response.json();
    if (!res?.data) throw new Error("Failed to fetch countries");
    return res.data;
  } catch (error: unknown) {
    console.error("Error fetching countries:", error);
    throw error;
  }
};

// Shared Countries Hook (uses /api/v1/countries)
export const useSharedFetchCountries = (options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["shared-countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 15, // 15 minutes - countries don't change often
    refetchOnWindowFocus: false,
    ...options,
  });
};

// ================================
// Multi-Instance Operations (Shared across all contexts)
// ================================

const createMultiInstance = async (
  instanceData: Record<string, unknown>,
  apiClient: ApiClient = clientApi as unknown as ApiClient
): Promise<unknown> => {
  const res = await apiClient("POST", "/instances/create", instanceData);
  if (!res.data) throw new Error("Failed to create multi instance");
  return res.data;
};

const previewMultiInstancePricing = async (
  pricingData: Record<string, unknown>,
  apiClient: ApiClient = clientApi as unknown as ApiClient
): Promise<unknown> => {
  const res = await apiClient("POST", "/instances/preview-pricing", pricingData);
  if (!res.data) throw new Error("Failed to preview multi instance pricing");
  return res.data;
};

const getMultiInstanceResources = async (
  silentApiClient: ApiClient = clientSilentApi as unknown as ApiClient
): Promise<ApiResponse<unknown>> => {
  const res = await silentApiClient("GET", "/instances/resources");
  if (!res.data) throw new Error("Failed to get multi instance resources");
  return res;
};

const validateMultiInstanceConfiguration = async (
  configData: Record<string, unknown>,
  apiClient: ApiClient = clientApi as unknown as ApiClient
): Promise<unknown> => {
  const res = await apiClient("POST", "/instances/validate-configuration", configData);
  if (!res.data) throw new Error("Failed to validate multi instance configuration");
  return res.data;
};

const createMultiInstancePreview = async (
  previewData: Record<string, unknown>,
  apiClient: ApiClient = clientApi as unknown as ApiClient
): Promise<unknown> => {
  const res = await apiClient("POST", "/instances/preview", previewData);
  if (!res.data) throw new Error("Failed to create multi instance preview");
  return res.data;
};

// ================================
// Instance Lifecycle Operations (Shared across all contexts)
// ================================

const fetchInstanceLifecycleById = async (
  identifier: string | number,
  silentApiClient: ApiClient = clientSilentApi as unknown as ApiClient
): Promise<unknown> => {
  const res = await silentApiClient("GET", `/instance-lifecycles/${identifier}`);
  if (!res.data)
    throw new Error(`Failed to fetch instance lifecycle with identifier ${identifier}`);
  return res.data;
};

const createInstanceLifecycle = async (
  identifier: string | number,
  lifecycleData: Record<string, unknown>,
  apiClient: ApiClient = clientApi as unknown as ApiClient
): Promise<unknown> => {
  const res = await apiClient("POST", `/instance-lifecycles/${identifier}`, lifecycleData);
  if (!res.data) throw new Error(`Failed to create instance lifecycle for ${identifier}`);
  return res.data;
};

const deleteInstanceLifecycle = async (
  identifier: string | number,
  apiClient: ApiClient = clientApi as unknown as ApiClient
): Promise<unknown> => {
  const res = await apiClient("DELETE", `/instance-lifecycles/${identifier}`);
  if (!res.data) throw new Error(`Failed to delete instance lifecycle for ${identifier}`);
  return res.data;
};

// ================================
// Instance Console Operations (Shared across all contexts)
// ================================

const fetchInstanceConsoleById = async (
  id: string | number,
  silentApiClient: ApiClient = clientSilentApi as unknown as ApiClient,
  consoleType: string = "novnc"
): Promise<unknown> => {
  const typeParam = consoleType ? `?type=${encodeURIComponent(consoleType)}` : "";
  const res = await silentApiClient(
    "GET",
    `/instance-consoles/${encodeURIComponent(String(id))}${typeParam}`
  );
  if (!res.data) throw new Error(`Failed to fetch instance console with ID ${id}`);
  return res.data;
};

const fetchAdminInstanceConsoleById = async (
  id: string | number,
  consoleType: string = "novnc"
): Promise<ApiResponse<{ url: string }>> => {
  const typeParam = consoleType ? `?type=${encodeURIComponent(consoleType)}` : "";
  const authState = useAdminAuthStore?.getState?.();
  const headers = authState?.getAuthHeaders?.() || {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const response = await fetch(
    `${config.adminURL}/instance-management/${encodeURIComponent(id)}/console${typeParam}`,
    {
      method: "GET",
      headers,
      credentials: "include",
    }
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || payload?.message || "Failed to fetch instance console");
  }

  return payload?.data || payload;
};

// ================================
// BUSINESS/CLIENT CONTEXT HOOKS
// ================================

// Multi-Instance Hooks for Business/Client
export const useCreateMultiInstance = () => {
  return useMutation({
    mutationFn: (instanceData: Record<string, unknown>) =>
      createMultiInstance(instanceData, clientApi as unknown as ApiClient),
    onError: (error: unknown) => {
      console.error("Error creating multi instance:", error);
    },
  });
};

export const usePreviewMultiInstancePricing = () => {
  return useMutation({
    mutationFn: (pricingData: Record<string, unknown>) =>
      previewMultiInstancePricing(pricingData, clientApi as unknown as ApiClient),
    onError: (error: unknown) => {
      console.error("Error previewing multi instance pricing:", error);
    },
  });
};

export const useFetchMultiInstanceResources = (options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["multi-instance-resources"],
    queryFn: () => getMultiInstanceResources(clientSilentApi as unknown as ApiClient),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useValidateMultiInstanceConfiguration = () => {
  return useMutation({
    mutationFn: (configData: Record<string, unknown>) =>
      validateMultiInstanceConfiguration(configData, clientApi as unknown as ApiClient),
    onError: (error: unknown) => {
      console.error("Error validating multi instance configuration:", error);
    },
  });
};

export const useCreateMultiInstancePreview = () => {
  return useMutation({
    mutationFn: (previewData: Record<string, unknown>) =>
      createMultiInstancePreview(previewData, clientApi as unknown as ApiClient),
    onError: (error: unknown) => {
      console.error("Error creating multi instance preview:", error);
    },
  });
};

// Instance Lifecycle Hooks for Business/Client
export const useFetchInstanceLifecycleById = (
  identifier: string | number | null | undefined,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["instance-lifecycle", identifier],
    queryFn: () => fetchInstanceLifecycleById(identifier!, clientSilentApi as unknown as ApiClient),
    enabled: !!identifier,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateInstanceLifecycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      identifier,
      lifecycleData,
    }: {
      identifier: string | number;
      lifecycleData: Record<string, unknown>;
    }) => createInstanceLifecycle(identifier, lifecycleData, clientApi as unknown as ApiClient),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["instance-lifecycle", variables.identifier] });
    },
    onError: (error: unknown) => {
      console.error("Error creating instance lifecycle:", error);
    },
  });
};

export const useDeleteInstanceLifecycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (identifier: string | number) =>
      deleteInstanceLifecycle(identifier, clientApi as unknown as ApiClient),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["instance-lifecycle", variables] });
    },
    onError: (error: unknown) => {
      console.error("Error deleting instance lifecycle:", error);
    },
  });
};

// Instance Console Hooks for Business/Client
export const useFetchInstanceConsoleById = (
  id: string | number | null | undefined,
  options: Record<string, unknown> = {}
) => {
  const { consoleType, ...queryOptions } = options;
  return useQuery({
    queryKey: ["instance-console", id, consoleType],
    queryFn: () =>
      fetchInstanceConsoleById(id!, clientSilentApi as unknown as ApiClient, consoleType as string),
    enabled: !!id,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

// ADMIN CONTEXT HOOKS
// ================================

// Multi-Instance Hooks for Admin
export const useAdminCreateMultiInstance = () => {
  return useMutation({
    mutationFn: (instanceData: Record<string, unknown>) =>
      createMultiInstance(instanceData, adminApi as unknown as ApiClient),
    onError: (error: unknown) => {
      console.error("Error creating multi instance (admin):", error);
    },
  });
};

export const useAdminPreviewMultiInstancePricing = () => {
  return useMutation({
    mutationFn: (pricingData: Record<string, unknown>) =>
      previewMultiInstancePricing(pricingData, adminApi as unknown as ApiClient),
    onError: (error: unknown) => {
      console.error("Error previewing multi instance pricing (admin):", error);
    },
  });
};

export const useAdminFetchMultiInstanceResources = (options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["admin-multi-instance-resources"],
    queryFn: () => getMultiInstanceResources(silentAdminApi as unknown as ApiClient),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useAdminValidateMultiInstanceConfiguration = () => {
  return useMutation({
    mutationFn: (configData: Record<string, unknown>) =>
      validateMultiInstanceConfiguration(configData, adminApi as unknown as ApiClient),
    onError: (error: unknown) => {
      console.error("Error validating multi instance configuration (admin):", error);
    },
  });
};

export const useAdminCreateMultiInstancePreview = () => {
  return useMutation({
    mutationFn: (previewData: Record<string, unknown>) =>
      createMultiInstancePreview(previewData, adminApi as unknown as ApiClient),
    onError: (error: unknown) => {
      console.error("Error creating multi instance preview (admin):", error);
    },
  });
};

// Instance Lifecycle Hooks for Admin
export const useAdminFetchInstanceLifecycleById = (
  identifier: string | number | null | undefined,
  options: Record<string, unknown> = {}
) => {
  const silentApiClient = silentAdminApi as unknown as ApiClient;
  return useQuery({
    queryKey: ["admin-instance-lifecycle", identifier],
    queryFn: async () => {
      const res = await silentApiClient("GET", `/instances/${identifier}`);
      const instance = (res?.data || {}) as Record<string, unknown>;
      const history =
        instance["status_history"] ||
        instance["lifecycle_history"] ||
        instance["lifecycle_events"] ||
        instance["history"] ||
        [];

      return {
        events: Array.isArray(history) ? history : [],
      };
    },
    enabled: !!identifier,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useAdminCreateInstanceLifecycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      identifier,
      lifecycleData,
    }: {
      identifier: string | number;
      lifecycleData: Record<string, unknown>;
    }) => createInstanceLifecycle(identifier, lifecycleData, adminApi as unknown as ApiClient),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-instance-lifecycle", variables.identifier],
      });
    },
    onError: (error: unknown) => {
      console.error("Error creating instance lifecycle (admin):", error);
    },
  });
};

export const useAdminDeleteInstanceLifecycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (identifier: string | number) =>
      deleteInstanceLifecycle(identifier, adminApi as unknown as ApiClient),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-instance-lifecycle", variables] });
    },
    onError: (error: unknown) => {
      console.error("Error deleting instance lifecycle (admin):", error);
    },
  });
};

// Instance Console Hooks for Admin
export const useAdminFetchInstanceConsoleById = (
  id: string | number | null | undefined,
  options: Record<string, unknown> = {}
) => {
  const { consoleType, ...queryOptions } = options;
  return useQuery({
    queryKey: ["admin-instance-console", id, consoleType],
    queryFn: () => fetchAdminInstanceConsoleById(id!, consoleType as string),
    enabled: !!id,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

// TENANT CONTEXT HOOKS
// ================================

// Multi-Instance Hooks for Tenant
export const useTenantCreateMultiInstance = () => {
  return useMutation({
    mutationFn: (instanceData: Record<string, unknown>) =>
      createMultiInstance(instanceData, tenantApi as unknown as ApiClient),
    onError: (error: unknown) => {
      console.error("Error creating multi instance (tenant):", error);
    },
  });
};

export const useTenantPreviewMultiInstancePricing = () => {
  return useMutation({
    mutationFn: (pricingData: Record<string, unknown>) =>
      previewMultiInstancePricing(pricingData, tenantApi as unknown as ApiClient),
    onError: (error: unknown) => {
      console.error("Error previewing multi instance pricing (tenant):", error);
    },
  });
};

export const useTenantFetchMultiInstanceResources = (options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["tenant-multi-instance-resources"],
    queryFn: () => getMultiInstanceResources(silentTenantApi as unknown as ApiClient),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useTenantValidateMultiInstanceConfiguration = () => {
  return useMutation({
    mutationFn: (configData: Record<string, unknown>) =>
      validateMultiInstanceConfiguration(configData, tenantApi as unknown as ApiClient),
    onError: (error: unknown) => {
      console.error("Error validating multi instance configuration (tenant):", error);
    },
  });
};

export const useTenantCreateMultiInstancePreview = () => {
  return useMutation({
    mutationFn: (previewData: Record<string, unknown>) =>
      createMultiInstancePreview(previewData, tenantApi as unknown as ApiClient),
    onError: (error: unknown) => {
      console.error("Error creating multi instance preview (tenant):", error);
    },
  });
};

// Instance Lifecycle Hooks for Tenant
export const useTenantFetchInstanceLifecycleById = (
  identifier: string | number | null | undefined,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["tenant-instance-lifecycle", identifier],
    queryFn: () => fetchInstanceLifecycleById(identifier!, silentTenantApi as unknown as ApiClient),
    enabled: !!identifier,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useTenantCreateInstanceLifecycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      identifier,
      lifecycleData,
    }: {
      identifier: string | number;
      lifecycleData: Record<string, unknown>;
    }) => createInstanceLifecycle(identifier, lifecycleData, tenantApi as unknown as ApiClient),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenant-instance-lifecycle", variables.identifier],
      });
    },
    onError: (error: unknown) => {
      console.error("Error creating instance lifecycle (tenant):", error);
    },
  });
};

export const useTenantDeleteInstanceLifecycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (identifier: string | number) =>
      deleteInstanceLifecycle(identifier, tenantApi as unknown as ApiClient),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-instance-lifecycle", variables] });
    },
    onError: (error: unknown) => {
      console.error("Error deleting instance lifecycle (tenant):", error);
    },
  });
};

// Instance Console Hooks for Tenant
export const useTenantFetchInstanceConsoleById = (
  id: string | number | null | undefined,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["tenant-instance-console", id],
    queryFn: () => fetchInstanceConsoleById(id!, silentTenantApi as unknown as ApiClient),
    enabled: !!id,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Combined Operations Hooks
// ================================

// Business/Client combined operations
export const useSharedResourceOperations = () => {
  const queryClient = useQueryClient();

  const invalidateSharedResources = () => {
    queryClient.invalidateQueries({ queryKey: ["multi-instance-resources"] });
    queryClient.invalidateQueries({ queryKey: ["instance-lifecycle"] });
    queryClient.invalidateQueries({ queryKey: ["instance-console"] });
  };

  return {
    // Multi-instance operations
    createMultiInstance: useCreateMultiInstance(),
    previewMultiInstancePricing: usePreviewMultiInstancePricing(),
    validateMultiInstanceConfiguration: useValidateMultiInstanceConfiguration(),
    createMultiInstancePreview: useCreateMultiInstancePreview(),

    // Instance lifecycle operations
    createInstanceLifecycle: useCreateInstanceLifecycle(),
    deleteInstanceLifecycle: useDeleteInstanceLifecycle(),

    // Utility functions
    invalidateSharedResources,
  };
};

// Admin combined operations
export const useAdminSharedResourceOperations = () => {
  const queryClient = useQueryClient();

  const invalidateAdminSharedResources = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-multi-instance-resources"] });
    queryClient.invalidateQueries({ queryKey: ["admin-instance-lifecycle"] });
    queryClient.invalidateQueries({ queryKey: ["admin-instance-console"] });
  };

  return {
    // Multi-instance operations
    createMultiInstance: useAdminCreateMultiInstance(),
    previewMultiInstancePricing: useAdminPreviewMultiInstancePricing(),
    validateMultiInstanceConfiguration: useAdminValidateMultiInstanceConfiguration(),
    createMultiInstancePreview: useAdminCreateMultiInstancePreview(),

    // Instance lifecycle operations
    createInstanceLifecycle: useAdminCreateInstanceLifecycle(),
    deleteInstanceLifecycle: useAdminDeleteInstanceLifecycle(),

    // Utility functions
    invalidateAdminSharedResources,
  };
};

// Tenant combined operations
export const useTenantSharedResourceOperations = () => {
  const queryClient = useQueryClient();

  const invalidateTenantSharedResources = () => {
    queryClient.invalidateQueries({ queryKey: ["tenant-multi-instance-resources"] });
    queryClient.invalidateQueries({ queryKey: ["tenant-instance-lifecycle"] });
    queryClient.invalidateQueries({ queryKey: ["tenant-instance-console"] });
  };

  return {
    // Multi-instance operations
    createMultiInstance: useTenantCreateMultiInstance(),
    previewMultiInstancePricing: useTenantPreviewMultiInstancePricing(),
    validateMultiInstanceConfiguration: useTenantValidateMultiInstanceConfiguration(),
    createMultiInstancePreview: useTenantCreateMultiInstancePreview(),

    // Instance lifecycle operations
    createInstanceLifecycle: useTenantCreateInstanceLifecycle(),
    deleteInstanceLifecycle: useTenantDeleteInstanceLifecycle(),

    // Utility functions
    invalidateTenantSharedResources,
  };
};

// Export individual functions for direct use if needed
export {
  createMultiInstance,
  previewMultiInstancePricing,
  getMultiInstanceResources,
  validateMultiInstanceConfiguration,
  createMultiInstancePreview,
  fetchInstanceLifecycleById,
  createInstanceLifecycle,
  deleteInstanceLifecycle,
  fetchInstanceConsoleById,
};
