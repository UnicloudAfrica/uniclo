import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tenantApi from "../index/tenant/tenantApi";
import silentTenantApi from "../index/tenant/silentTenant";

/**
 * Tenant Admin API Hooks
 *
 * These hooks provide comprehensive tenant admin functionality for all endpoints
 * available in tenant.php (/tenant/v1/admin/*)
 */

// ================================
// Tax Types Endpoints
// ================================

const fetchTaxTypes = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentTenantApi("GET", `/tax-types${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch tax types");
  return res;
};

const createTaxType = async (taxTypeData) => {
  const res = await tenantApi("POST", "/tax-types", taxTypeData);
  if (!res.data) throw new Error("Failed to create tax type");
  return res.data;
};

const fetchTaxTypeById = async (id) => {
  const res = await silentTenantApi("GET", `/tax-types/${id}`);
  if (!res.data) throw new Error(`Failed to fetch tax type with ID ${id}`);
  return res.data;
};

const updateTaxType = async ({ id, taxTypeData }) => {
  const res = await tenantApi("PUT", `/tax-types/${id}`, taxTypeData);
  if (!res.data) throw new Error(`Failed to update tax type with ID ${id}`);
  return res.data;
};

const deleteTaxType = async (id) => {
  const res = await tenantApi("DELETE", `/tax-types/${id}`);
  if (!res.data) throw new Error(`Failed to delete tax type with ID ${id}`);
  return res.data;
};

// ================================
// Dashboard Endpoints
// ================================

const fetchDashboard = async () => {
  const res = await silentTenantApi("GET", "/admin/dashboard");
  if (!res.data) throw new Error("Failed to fetch dashboard data");
  return res;
};

// ================================
// Tax Configuration Endpoints
// ================================

const fetchTaxConfigurations = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentTenantApi("GET", `/admin/tax${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch tax configurations");
  return res;
};

const createTaxConfiguration = async (taxConfigData) => {
  const res = await tenantApi("POST", "/admin/tax", taxConfigData);
  if (!res.data) throw new Error("Failed to create tax configuration");
  return res.data;
};

const fetchTaxConfigurationById = async (id) => {
  const res = await silentTenantApi("GET", `/admin/tax/${id}`);
  if (!res.data) throw new Error(`Failed to fetch tax configuration with ID ${id}`);
  return res.data;
};

const updateTaxConfiguration = async ({ id, taxConfigData }) => {
  const res = await tenantApi("PUT", `/admin/tax/${id}`, taxConfigData);
  if (!res.data) throw new Error(`Failed to update tax configuration with ID ${id}`);
  return res.data;
};

const deleteTaxConfiguration = async (id) => {
  const res = await tenantApi("DELETE", `/admin/tax/${id}`);
  if (!res.data) throw new Error(`Failed to delete tax configuration with ID ${id}`);
  return res.data;
};

// ================================
// Product Pricing Endpoints
// ================================

const fetchTenantProductPricing = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentTenantApi(
    "GET",
    `/admin/product-pricing${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch tenant product pricing");
  return res;
};

const createTenantProductPricing = async (pricingData) => {
  const res = await tenantApi("POST", "/admin/product-pricing", pricingData);
  if (!res.data) throw new Error("Failed to create tenant product pricing");
  return res.data;
};

const fetchTenantProductPricingById = async (id) => {
  const res = await silentTenantApi("GET", `/admin/product-pricing/${id}`);
  if (!res.data) throw new Error(`Failed to fetch tenant product pricing with ID ${id}`);
  return res.data;
};

const updateTenantProductPricing = async ({ id, pricingData }) => {
  const res = await tenantApi("PUT", `/admin/product-pricing/${id}`, pricingData);
  if (!res.data) throw new Error(`Failed to update tenant product pricing with ID ${id}`);
  return res.data;
};

const deleteTenantProductPricing = async (id) => {
  const res = await tenantApi("DELETE", `/admin/product-pricing/${id}`);
  if (!res.data) throw new Error(`Failed to delete tenant product pricing with ID ${id}`);
  return res.data;
};

// Import Product Pricing
const importTenantProductPricing = async (importData) => {
  const res = await tenantApi("POST", "/admin/product-pricing/import", importData);
  if (!res.data) throw new Error("Failed to import tenant product pricing");
  return res.data;
};

// ================================
// Profile Endpoints
// ================================

const fetchTenantProfile = async () => {
  const res = await silentTenantApi("GET", "/admin/profile");
  if (!res.data) throw new Error("Failed to fetch tenant profile");
  return res;
};

const createTenantProfile = async (profileData) => {
  const res = await tenantApi("POST", "/admin/profile", profileData);
  if (!res.data) throw new Error("Failed to create tenant profile");
  return res.data;
};

// ================================
// Images Endpoints
// ================================

const fetchTenantImages = async () => {
  const res = await silentTenantApi("GET", "/admin/images");
  if (!res.data) throw new Error("Failed to fetch tenant images");
  return res;
};

// ================================
// Instance Types Endpoints
// ================================

const fetchTenantInstanceTypes = async () => {
  const res = await silentTenantApi("GET", "/admin/instance-types");
  if (!res.data) throw new Error("Failed to fetch tenant instance types");
  return res;
};

// ================================
// Instance Console Endpoints
// ================================

const fetchTenantInstanceConsoleById = async (id) => {
  const res = await silentTenantApi("GET", `/instance-consoles/${id}`);
  if (!res.data) throw new Error(`Failed to fetch tenant instance console with ID ${id}`);
  return res.data;
};

// ================================
// Multi Initiation Previews Endpoints
// ================================

const createTenantMultiInitiationPreview = async (previewData) => {
  const res = await tenantApi("POST", "/admin/multi-initiation-previews", previewData);
  if (!res.data) throw new Error("Failed to create tenant multi initiation preview");
  return res.data;
};

// ================================
// User Profile Endpoints
// ================================

const fetchTenantUserProfiles = async () => {
  const res = await silentTenantApi("GET", "/admin/user-profile");
  if (!res.data) throw new Error("Failed to fetch tenant user profiles");
  return res;
};

const createTenantUserProfile = async (profileData) => {
  const res = await tenantApi("POST", "/admin/user-profile", profileData);
  if (!res.data) throw new Error("Failed to create tenant user profile");
  return res.data;
};

const fetchTenantUserProfileById = async (id) => {
  const res = await silentTenantApi("GET", `/admin/user-profile/${id}`);
  if (!res.data) throw new Error(`Failed to fetch tenant user profile with ID ${id}`);
  return res.data;
};

const deleteTenantUserProfile = async (id) => {
  const res = await tenantApi("DELETE", `/admin/user-profile/${id}`);
  if (!res.data) throw new Error(`Failed to delete tenant user profile with ID ${id}`);
  return res.data;
};

// ================================
// Workspaces Endpoints
// ================================

const fetchTenantWorkspaces = async () => {
  const res = await silentTenantApi("GET", "/admin/workspaces");
  if (!res.data) throw new Error("Failed to fetch tenant workspaces");
  return res;
};

const createTenantWorkspace = async (workspaceData) => {
  const res = await tenantApi("POST", "/admin/workspaces", workspaceData);
  if (!res.data) throw new Error("Failed to create tenant workspace");
  return res.data;
};

const fetchTenantWorkspaceById = async (id) => {
  const res = await silentTenantApi("GET", `/admin/workspaces/${id}`);
  if (!res.data) throw new Error(`Failed to fetch tenant workspace with ID ${id}`);
  return res.data;
};

const deleteTenantWorkspace = async (id) => {
  const res = await tenantApi("DELETE", `/admin/workspaces/${id}`);
  if (!res.data) throw new Error(`Failed to delete tenant workspace with ID ${id}`);
  return res.data;
};

// ================================
// Domain Settings Endpoints
// ================================

const fetchTenantDomainSettings = async () => {
  const res = await silentTenantApi("GET", "/admin/domain-settings");
  if (!res.data) throw new Error("Failed to fetch tenant domain settings");
  return res;
};

const createTenantDomainSetting = async (domainData) => {
  const res = await tenantApi("POST", "/admin/domain-settings", domainData);
  if (!res.data) throw new Error("Failed to create tenant domain setting");
  return res.data;
};

const updateTenantDomainSetting = async ({ id, domainData }) => {
  const res = await tenantApi("PUT", `/admin/domain-settings/${id}`, domainData);
  if (!res.data) throw new Error(`Failed to update tenant domain setting with ID ${id}`);
  return res.data;
};

const deleteTenantDomainSetting = async (id) => {
  const res = await tenantApi("DELETE", `/admin/domain-settings/${id}`);
  if (!res.data) throw new Error(`Failed to delete tenant domain setting with ID ${id}`);
  return res.data;
};

// ================================
// HOOKS - Tax Types
// ================================

export const useFetchTaxTypes = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["tax-types", params],
    queryFn: () => fetchTaxTypes(params),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaxType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-types"] });
    },
    onError: (error) => {
      console.error("Error creating tax type:", error);
    },
  });
};

export const useFetchTaxTypeById = (id, options = {}) => {
  return useQuery({
    queryKey: ["tax-type", id],
    queryFn: () => fetchTaxTypeById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTaxType,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tax-types"] });
      queryClient.invalidateQueries({ queryKey: ["tax-type", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating tax type:", error);
    },
  });
};

export const useDeleteTaxType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaxType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-types"] });
    },
    onError: (error) => {
      console.error("Error deleting tax type:", error);
    },
  });
};

// ================================
// HOOKS - Dashboard
// ================================

export const useFetchTenantDashboard = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-dashboard"],
    queryFn: fetchDashboard,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// ================================
// HOOKS - Tax Configuration
// ================================

export const useFetchTaxConfigurations = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["tax-configurations", params],
    queryFn: () => fetchTaxConfigurations(params),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTaxConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaxConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-configurations"] });
    },
    onError: (error) => {
      console.error("Error creating tax configuration:", error);
    },
  });
};

export const useFetchTaxConfigurationById = (id, options = {}) => {
  return useQuery({
    queryKey: ["tax-configuration", id],
    queryFn: () => fetchTaxConfigurationById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateTaxConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTaxConfiguration,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tax-configurations"] });
      queryClient.invalidateQueries({ queryKey: ["tax-configuration", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating tax configuration:", error);
    },
  });
};

export const useDeleteTaxConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaxConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-configurations"] });
    },
    onError: (error) => {
      console.error("Error deleting tax configuration:", error);
    },
  });
};

// ================================
// HOOKS - Product Pricing
// ================================

export const useFetchTenantProductPricing = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["tenant-product-pricing", params],
    queryFn: () => fetchTenantProductPricing(params),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-product-pricing"] });
    },
    onError: (error) => {
      console.error("Error creating tenant product pricing:", error);
    },
  });
};

export const useFetchTenantProductPricingById = (id, options = {}) => {
  return useQuery({
    queryKey: ["tenant-product-pricing", id],
    queryFn: () => fetchTenantProductPricingById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateTenantProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantProductPricing,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-product-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-product-pricing", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating tenant product pricing:", error);
    },
  });
};

export const useDeleteTenantProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenantProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-product-pricing"] });
    },
    onError: (error) => {
      console.error("Error deleting tenant product pricing:", error);
    },
  });
};

export const useImportTenantProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importTenantProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-product-pricing"] });
    },
    onError: (error) => {
      console.error("Error importing tenant product pricing:", error);
    },
  });
};

// ================================
// HOOKS - Profile
// ================================

export const useFetchTenantProfile = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-profile"],
    queryFn: fetchTenantProfile,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
    },
    onError: (error) => {
      console.error("Error creating tenant profile:", error);
    },
  });
};

// ================================
// HOOKS - Images
// ================================

export const useFetchTenantImages = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-images"],
    queryFn: fetchTenantImages,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// ================================
// HOOKS - Instance Types
// ================================

export const useFetchTenantInstanceTypes = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-instance-types"],
    queryFn: fetchTenantInstanceTypes,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// ================================
// HOOKS - Multi Initiation Previews
// ================================

export const useCreateTenantMultiInitiationPreview = () => {
  return useMutation({
    mutationFn: createTenantMultiInitiationPreview,
    onError: (error) => {
      console.error("Error creating tenant multi initiation preview:", error);
    },
  });
};

// ================================
// HOOKS - User Profile
// ================================

export const useFetchTenantUserProfiles = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-user-profiles"],
    queryFn: fetchTenantUserProfiles,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantUserProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-user-profiles"] });
    },
    onError: (error) => {
      console.error("Error creating tenant user profile:", error);
    },
  });
};

export const useFetchTenantUserProfileById = (id, options = {}) => {
  return useQuery({
    queryKey: ["tenant-user-profile", id],
    queryFn: () => fetchTenantUserProfileById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useDeleteTenantUserProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenantUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-user-profiles"] });
    },
    onError: (error) => {
      console.error("Error deleting tenant user profile:", error);
    },
  });
};

// ================================
// HOOKS - Workspaces
// ================================

export const useFetchTenantWorkspaces = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-workspaces"],
    queryFn: fetchTenantWorkspaces,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-workspaces"] });
    },
    onError: (error) => {
      console.error("Error creating tenant workspace:", error);
    },
  });
};

export const useFetchTenantWorkspaceById = (id, options = {}) => {
  return useQuery({
    queryKey: ["tenant-workspace", id],
    queryFn: () => fetchTenantWorkspaceById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useDeleteTenantWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenantWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-workspaces"] });
    },
    onError: (error) => {
      console.error("Error deleting tenant workspace:", error);
    },
  });
};

// ================================
// HOOKS - Domain Settings
// ================================

export const useFetchTenantDomainSettings = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-domain-settings"],
    queryFn: fetchTenantDomainSettings,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantDomainSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantDomainSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-domain-settings"] });
    },
    onError: (error) => {
      console.error("Error creating tenant domain setting:", error);
    },
  });
};

export const useUpdateTenantDomainSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantDomainSetting,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-domain-settings"] });
    },
    onError: (error) => {
      console.error("Error updating tenant domain setting:", error);
    },
  });
};

export const useDeleteTenantDomainSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenantDomainSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-domain-settings"] });
    },
    onError: (error) => {
      console.error("Error deleting tenant domain setting:", error);
    },
  });
};

// ================================
// Combined Operations Hook
// ================================

// Hook that provides access to all tenant admin operations
export const useTenantAdminOperations = () => {
  const queryClient = useQueryClient();

  const invalidateAllTenantData = () => {
    queryClient.invalidateQueries({ queryKey: ["tax-types"] });
    queryClient.invalidateQueries({ queryKey: ["tax-configurations"] });
    queryClient.invalidateQueries({ queryKey: ["tenant-product-pricing"] });
    queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
    queryClient.invalidateQueries({ queryKey: ["tenant-workspaces"] });
    queryClient.invalidateQueries({ queryKey: ["tenant-domain-settings"] });
  };

  return {
    // Tax operations
    createTaxType: useCreateTaxType(),
    updateTaxType: useUpdateTaxType(),
    deleteTaxType: useDeleteTaxType(),

    // Tax configuration operations
    createTaxConfiguration: useCreateTaxConfiguration(),
    updateTaxConfiguration: useUpdateTaxConfiguration(),
    deleteTaxConfiguration: useDeleteTaxConfiguration(),

    // Product pricing operations
    createTenantProductPricing: useCreateTenantProductPricing(),
    updateTenantProductPricing: useUpdateTenantProductPricing(),
    deleteTenantProductPricing: useDeleteTenantProductPricing(),
    importTenantProductPricing: useImportTenantProductPricing(),

    // Profile operations
    createTenantProfile: useCreateTenantProfile(),

    // Workspace operations
    createTenantWorkspace: useCreateTenantWorkspace(),
    deleteTenantWorkspace: useDeleteTenantWorkspace(),

    // Domain settings operations
    createTenantDomainSetting: useCreateTenantDomainSetting(),
    updateTenantDomainSetting: useUpdateTenantDomainSetting(),
    deleteTenantDomainSetting: useDeleteTenantDomainSetting(),

    // Utility functions
    invalidateAllTenantData,
  };
};

// Export individual functions for direct use if needed
export {
  fetchTaxTypes,
  createTaxType,
  fetchTaxTypeById,
  updateTaxType,
  deleteTaxType,
  fetchDashboard,
  fetchTaxConfigurations,
  createTaxConfiguration,
  updateTaxConfiguration,
  deleteTaxConfiguration,
  fetchTenantProductPricing,
  createTenantProductPricing,
  updateTenantProductPricing,
  deleteTenantProductPricing,
  importTenantProductPricing,
  fetchTenantProfile,
  createTenantProfile,
  fetchTenantImages,
  fetchTenantInstanceTypes,
  fetchTenantInstanceConsoleById,
  createTenantMultiInitiationPreview,
  fetchTenantUserProfiles,
  createTenantUserProfile,
  fetchTenantUserProfileById,
  deleteTenantUserProfile,
  fetchTenantWorkspaces,
  createTenantWorkspace,
  fetchTenantWorkspaceById,
  deleteTenantWorkspace,
  fetchTenantDomainSettings,
  createTenantDomainSetting,
  updateTenantDomainSetting,
  deleteTenantDomainSetting,
};
