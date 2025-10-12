import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "../index/admin/api";
import silentAdminApi from "../index/admin/silent";

/**
 * Admin API Hooks
 * 
 * These hooks provide comprehensive admin functionality for all endpoints
 * available in admin.php (/admin/v1/*)
 */

// ================================
// Tenants Endpoints
// ================================

const fetchTenants = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentAdminApi("GET", `/tenants${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch tenants");
  return res;
};

const createTenant = async (tenantData) => {
  const res = await adminApi("POST", "/tenants", tenantData);
  if (!res.data) throw new Error("Failed to create tenant");
  return res.data;
};

const fetchTenantById = async (id) => {
  const res = await silentAdminApi("GET", `/tenants/${id}`);
  if (!res.data) throw new Error(`Failed to fetch tenant with ID ${id}`);
  return res.data;
};

const updateTenant = async ({ id, tenantData }) => {
  const res = await adminApi("PUT", `/tenants/${id}`, tenantData);
  if (!res.data) throw new Error(`Failed to update tenant with ID ${id}`);
  return res.data;
};

const deleteTenant = async (id) => {
  const res = await adminApi("DELETE", `/tenants/${id}`);
  if (!res.data) throw new Error(`Failed to delete tenant with ID ${id}`);
  return res.data;
};

// ================================
// Sub-Tenants Endpoints
// ================================

const fetchSubTenants = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentAdminApi("GET", `/sub-tenants${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch sub-tenants");
  return res;
};

const createSubTenant = async (subTenantData) => {
  const res = await adminApi("POST", "/sub-tenants", subTenantData);
  if (!res.data) throw new Error("Failed to create sub-tenant");
  return res.data;
};

const fetchSubTenantById = async (id) => {
  const res = await silentAdminApi("GET", `/sub-tenants/${id}`);
  if (!res.data) throw new Error(`Failed to fetch sub-tenant with ID ${id}`);
  return res.data;
};

const updateSubTenant = async ({ id, subTenantData }) => {
  const res = await adminApi("PUT", `/sub-tenants/${id}`, subTenantData);
  if (!res.data) throw new Error(`Failed to update sub-tenant with ID ${id}`);
  return res.data;
};

const deleteSubTenant = async (id) => {
  const res = await adminApi("DELETE", `/sub-tenants/${id}`);
  if (!res.data) throw new Error(`Failed to delete sub-tenant with ID ${id}`);
  return res.data;
};

// ================================
// Tenant Clients Endpoints
// ================================

const fetchTenantClientById = async (id) => {
  const res = await silentAdminApi("GET", `/tenant-clients/${id}`);
  if (!res.data) throw new Error(`Failed to fetch tenant client with ID ${id}`);
  return res.data;
};

// ================================
// Regions Endpoints
// ================================

const fetchRegions = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentAdminApi("GET", `/regions${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch regions");
  return res;
};

const createRegion = async (regionData) => {
  const res = await adminApi("POST", "/regions", regionData);
  if (!res.data) throw new Error("Failed to create region");
  return res.data;
};

const fetchRegionById = async (id) => {
  const res = await silentAdminApi("GET", `/regions/${id}`);
  if (!res.data) throw new Error(`Failed to fetch region with ID ${id}`);
  return res.data;
};

const updateRegion = async ({ id, regionData }) => {
  const res = await adminApi("PUT", `/regions/${id}`, regionData);
  if (!res.data) throw new Error(`Failed to update region with ID ${id}`);
  return res.data;
};

const deleteRegion = async (id) => {
  const res = await adminApi("DELETE", `/regions/${id}`);
  if (!res.data) throw new Error(`Failed to delete region with ID ${id}`);
  return res.data;
};

// ================================
// Product Pricing Endpoints
// ================================

const fetchAdminProductPricing = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentAdminApi("GET", `/product-pricing${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch admin product pricing");
  return res;
};

const createAdminProductPricing = async (pricingData) => {
  const res = await adminApi("POST", "/product-pricing", pricingData);
  if (!res.data) throw new Error("Failed to create admin product pricing");
  return res.data;
};

const fetchAdminProductPricingById = async (id) => {
  const res = await silentAdminApi("GET", `/product-pricing/${id}`);
  if (!res.data) throw new Error(`Failed to fetch admin product pricing with ID ${id}`);
  return res.data;
};

const updateAdminProductPricing = async ({ id, pricingData }) => {
  const res = await adminApi("PUT", `/product-pricing/${id}`, pricingData);
  if (!res.data) throw new Error(`Failed to update admin product pricing with ID ${id}`);
  return res.data;
};

const deleteAdminProductPricing = async (id) => {
  const res = await adminApi("DELETE", `/product-pricing/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin product pricing with ID ${id}`);
  return res.data;
};

// Export Product Pricing Template
const exportAdminProductPricingTemplate = async () => {
  const res = await silentAdminApi("GET", "/product-pricing/export-template");
  if (!res.data) throw new Error("Failed to export admin product pricing template");
  return res;
};

// Import Product Pricing
const importAdminProductPricing = async (importData) => {
  const res = await adminApi("POST", "/product-pricing/import", importData);
  if (!res.data) throw new Error("Failed to import admin product pricing");
  return res.data;
};

// ================================
// Provider Region Credentials Endpoints
// ================================

const fetchProviderRegionCredentials = async () => {
  const res = await silentAdminApi("GET", "/provider-region-credentials");
  if (!res.data) throw new Error("Failed to fetch provider region credentials");
  return res;
};

const createProviderRegionCredential = async (credentialData) => {
  const res = await adminApi("POST", "/provider-region-credentials", credentialData);
  if (!res.data) throw new Error("Failed to create provider region credential");
  return res.data;
};

const resetProviderRegionCredentialPassword = async (resetData) => {
  const res = await adminApi("POST", "/provider-region-credentials/reset-password", resetData);
  if (!res.data) throw new Error("Failed to reset provider region credential password");
  return res.data;
};

const linkProviderRegionCredentialUser = async (linkData) => {
  const res = await adminApi("POST", "/provider-region-credentials/link-user", linkData);
  if (!res.data) throw new Error("Failed to link provider region credential user");
  return res.data;
};

const rotateProviderRegionCredentialIfMissing = async (rotateData) => {
  const res = await adminApi("POST", "/provider-region-credentials/rotate-if-missing", rotateData);
  if (!res.data) throw new Error("Failed to rotate provider region credential");
  return res.data;
};

const reconcileProviderRegionCredentials = async (reconcileData) => {
  const res = await adminApi("POST", "/provider-region-credentials/reconcile", reconcileData);
  if (!res.data) throw new Error("Failed to reconcile provider region credentials");
  return res.data;
};

// ================================
// Provider Discovery Endpoints
// ================================

// Projects
const fetchProviderDiscoveryProjects = async () => {
  const res = await silentAdminApi("GET", "/provider-discovery/projects");
  if (!res.data) throw new Error("Failed to fetch provider discovery projects");
  return res;
};

const importProviderDiscoveryProjects = async (importData) => {
  const res = await adminApi("POST", "/provider-discovery/projects/import", importData);
  if (!res.data) throw new Error("Failed to import provider discovery projects");
  return res.data;
};

const syncProviderDiscoveryProjects = async (syncData) => {
  const res = await adminApi("POST", "/provider-discovery/projects/sync", syncData);
  if (!res.data) throw new Error("Failed to sync provider discovery projects");
  return res.data;
};

const fetchProviderDiscoveryProjectsDrift = async () => {
  const res = await silentAdminApi("GET", "/provider-discovery/projects/drift");
  if (!res.data) throw new Error("Failed to fetch provider discovery projects drift");
  return res;
};

// Users
const fetchProviderDiscoveryUsers = async () => {
  const res = await silentAdminApi("GET", "/provider-discovery/users");
  if (!res.data) throw new Error("Failed to fetch provider discovery users");
  return res;
};

const linkProviderDiscoveryUsers = async (linkData) => {
  const res = await adminApi("POST", "/provider-discovery/users/link", linkData);
  if (!res.data) throw new Error("Failed to link provider discovery users");
  return res.data;
};

// Runs
const fetchProviderDiscoveryRuns = async () => {
  const res = await silentAdminApi("GET", "/provider-discovery/runs");
  if (!res.data) throw new Error("Failed to fetch provider discovery runs");
  return res;
};

const fetchProviderDiscoveryRunById = async (id) => {
  const res = await silentAdminApi("GET", `/provider-discovery/runs/${id}`);
  if (!res.data) throw new Error(`Failed to fetch provider discovery run with ID ${id}`);
  return res.data;
};

// ================================
// Project User Syncs Endpoints
// ================================

const createProjectUserSync = async (syncData) => {
  const res = await adminApi("POST", "/project-user-syncs", syncData);
  if (!res.data) throw new Error("Failed to create project user sync");
  return res.data;
};

// ================================
// Multi Initiation Previews Endpoints
// ================================

const createAdminMultiInitiationPreview = async (previewData) => {
  const res = await adminApi("POST", "/multi-initiation-previews", previewData);
  if (!res.data) throw new Error("Failed to create admin multi initiation preview");
  return res.data;
};

// ================================
// Product Offers Endpoints
// ================================

const fetchAdminProductOffers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentAdminApi("GET", `/product-offers${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch admin product offers");
  return res;
};

const createAdminProductOffer = async (offerData) => {
  const res = await adminApi("POST", "/product-offers", offerData);
  if (!res.data) throw new Error("Failed to create admin product offer");
  return res.data;
};

const fetchAdminProductOfferById = async (id) => {
  const res = await silentAdminApi("GET", `/product-offers/${id}`);
  if (!res.data) throw new Error(`Failed to fetch admin product offer with ID ${id}`);
  return res.data;
};

const updateAdminProductOffer = async ({ id, offerData }) => {
  const res = await adminApi("PUT", `/product-offers/${id}`, offerData);
  if (!res.data) throw new Error(`Failed to update admin product offer with ID ${id}`);
  return res.data;
};

const deleteAdminProductOffer = async (id) => {
  const res = await adminApi("DELETE", `/product-offers/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin product offer with ID ${id}`);
  return res.data;
};

// ================================
// Tax Configurations Endpoints
// ================================

const fetchAdminTaxConfigurations = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentAdminApi("GET", `/tax-configurations${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch admin tax configurations");
  return res;
};

const createAdminTaxConfiguration = async (taxConfigData) => {
  const res = await adminApi("POST", "/tax-configurations", taxConfigData);
  if (!res.data) throw new Error("Failed to create admin tax configuration");
  return res.data;
};

const fetchAdminTaxConfigurationById = async (id) => {
  const res = await silentAdminApi("GET", `/tax-configurations/${id}`);
  if (!res.data) throw new Error(`Failed to fetch admin tax configuration with ID ${id}`);
  return res.data;
};

const updateAdminTaxConfiguration = async ({ id, taxConfigData }) => {
  const res = await adminApi("PUT", `/tax-configurations/${id}`, taxConfigData);
  if (!res.data) throw new Error(`Failed to update admin tax configuration with ID ${id}`);
  return res.data;
};

const deleteAdminTaxConfiguration = async (id) => {
  const res = await adminApi("DELETE", `/tax-configurations/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin tax configuration with ID ${id}`);
  return res.data;
};

// ================================
// Colocation Settings Endpoints
// ================================

const fetchColocationSettings = async () => {
  const res = await silentAdminApi("GET", "/colocation-settings");
  if (!res.data) throw new Error("Failed to fetch colocation settings");
  return res;
};

const createColocationSetting = async (colocationData) => {
  const res = await adminApi("POST", "/colocation-settings", colocationData);
  if (!res.data) throw new Error("Failed to create colocation setting");
  return res.data;
};

// ================================
// Products Endpoints
// ================================

const fetchAdminProducts = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentAdminApi("GET", `/products${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch admin products");
  return res;
};

const createAdminProduct = async (productData) => {
  const res = await adminApi("POST", "/products", productData);
  if (!res.data) throw new Error("Failed to create admin product");
  return res.data;
};

const fetchAdminProductById = async (id) => {
  const res = await silentAdminApi("GET", `/products/${id}`);
  if (!res.data) throw new Error(`Failed to fetch admin product with ID ${id}`);
  return res.data;
};

const updateAdminProduct = async ({ id, productData }) => {
  const res = await adminApi("PUT", `/products/${id}`, productData);
  if (!res.data) throw new Error(`Failed to update admin product with ID ${id}`);
  return res.data;
};

const deleteAdminProduct = async (id) => {
  const res = await adminApi("DELETE", `/products/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin product with ID ${id}`);
  return res.data;
};

// ================================
// Product Compute Instance Endpoints
// ================================

const fetchAdminProductComputeInstances = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentAdminApi("GET", `/product-compute-instance${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch admin product compute instances");
  return res;
};

const createAdminProductComputeInstance = async (instanceData) => {
  const res = await adminApi("POST", "/product-compute-instance", instanceData);
  if (!res.data) throw new Error("Failed to create admin product compute instance");
  return res.data;
};

// ================================
// Zadara Domains Endpoints
// ================================

const fetchZadaraDomains = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentAdminApi("GET", `/zadara-domains${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch Zadara domains");
  return res;
};

const createZadaraDomain = async (domainData) => {
  const res = await adminApi("POST", "/zadara-domains", domainData);
  if (!res.data) throw new Error("Failed to create Zadara domain");
  return res.data;
};

const fetchZadaraDomainById = async (id) => {
  const res = await silentAdminApi("GET", `/zadara-domains/${id}`);
  if (!res.data) throw new Error(`Failed to fetch Zadara domain with ID ${id}`);
  return res.data;
};

const updateZadaraDomain = async ({ id, domainData }) => {
  const res = await adminApi("PUT", `/zadara-domains/${id}`, domainData);
  if (!res.data) throw new Error(`Failed to update Zadara domain with ID ${id}`);
  return res.data;
};

const deleteZadaraDomain = async (id) => {
  const res = await adminApi("DELETE", `/zadara-domains/${id}`);
  if (!res.data) throw new Error(`Failed to delete Zadara domain with ID ${id}`);
  return res.data;
};

const syncZadaraDomainPolicies = async (syncData) => {
  const res = await adminApi("POST", "/zadara-domains/sync-policies", syncData);
  if (!res.data) throw new Error("Failed to sync Zadara domain policies");
  return res.data;
};

const assignZadaraDomainUserPolicies = async (assignData) => {
  const res = await adminApi("POST", "/zadara-domains/assign-user-policies", assignData);
  if (!res.data) throw new Error("Failed to assign Zadara domain user policies");
  return res.data;
};

const fetchZadaraDomainUserPolicies = async () => {
  const res = await silentAdminApi("GET", "/zadara-domains/user-policies");
  if (!res.data) throw new Error("Failed to fetch Zadara domain user policies");
  return res;
};

const fetchZadaraDomainTenantHierarchy = async (tenantId) => {
  const res = await silentAdminApi("GET", `/zadara-domains/tenant-hierarchy/${tenantId}`);
  if (!res.data) throw new Error(`Failed to fetch Zadara domain tenant hierarchy for tenant ${tenantId}`);
  return res.data;
};

// ================================
// HOOKS - Tenants
// ================================

export const useFetchTenants = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["tenants", params],
    queryFn: () => fetchTenants(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error) => {
      console.error("Error creating tenant:", error);
    },
  });
};

export const useFetchTenantById = (id, options = {}) => {
  return useQuery({
    queryKey: ["tenant", id],
    queryFn: () => fetchTenantById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenant,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating tenant:", error);
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error) => {
      console.error("Error deleting tenant:", error);
    },
  });
};

// ================================
// HOOKS - Sub-Tenants
// ================================

export const useFetchSubTenants = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["sub-tenants", params],
    queryFn: () => fetchSubTenants(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateSubTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-tenants"] });
    },
    onError: (error) => {
      console.error("Error creating sub-tenant:", error);
    },
  });
};

// ================================
// HOOKS - Regions
// ================================

export const useFetchRegions = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["regions", params],
    queryFn: () => fetchRegions(params),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
    onError: (error) => {
      console.error("Error creating region:", error);
    },
  });
};

export const useUpdateRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRegion,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      queryClient.invalidateQueries({ queryKey: ["region", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating region:", error);
    },
  });
};

export const useDeleteRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
    onError: (error) => {
      console.error("Error deleting region:", error);
    },
  });
};

// ================================
// HOOKS - Product Pricing
// ================================

export const useFetchAdminProductPricing = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["admin-product-pricing", params],
    queryFn: () => fetchAdminProductPricing(params),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateAdminProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-pricing"] });
    },
    onError: (error) => {
      console.error("Error creating admin product pricing:", error);
    },
  });
};

export const useExportAdminProductPricingTemplate = () => {
  return useMutation({
    mutationFn: exportAdminProductPricingTemplate,
    onError: (error) => {
      console.error("Error exporting admin product pricing template:", error);
    },
  });
};

export const useImportAdminProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importAdminProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-pricing"] });
    },
    onError: (error) => {
      console.error("Error importing admin product pricing:", error);
    },
  });
};

// ================================
// HOOKS - Provider Region Credentials
// ================================

export const useFetchProviderRegionCredentials = (options = {}) => {
  return useQuery({
    queryKey: ["provider-region-credentials"],
    queryFn: fetchProviderRegionCredentials,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateProviderRegionCredential = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProviderRegionCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-region-credentials"] });
    },
    onError: (error) => {
      console.error("Error creating provider region credential:", error);
    },
  });
};

export const useResetProviderRegionCredentialPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetProviderRegionCredentialPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-region-credentials"] });
    },
    onError: (error) => {
      console.error("Error resetting provider region credential password:", error);
    },
  });
};

// ================================
// HOOKS - Provider Discovery
// ================================

export const useFetchProviderDiscoveryProjects = (options = {}) => {
  return useQuery({
    queryKey: ["provider-discovery-projects"],
    queryFn: fetchProviderDiscoveryProjects,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useImportProviderDiscoveryProjects = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importProviderDiscoveryProjects,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-discovery-projects"] });
    },
    onError: (error) => {
      console.error("Error importing provider discovery projects:", error);
    },
  });
};

export const useSyncProviderDiscoveryProjects = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncProviderDiscoveryProjects,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-discovery-projects"] });
    },
    onError: (error) => {
      console.error("Error syncing provider discovery projects:", error);
    },
  });
};

export const useFetchProviderDiscoveryUsers = (options = {}) => {
  return useQuery({
    queryKey: ["provider-discovery-users"],
    queryFn: fetchProviderDiscoveryUsers,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProviderDiscoveryRuns = (options = {}) => {
  return useQuery({
    queryKey: ["provider-discovery-runs"],
    queryFn: fetchProviderDiscoveryRuns,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// ================================
// HOOKS - Zadara Domains
// ================================

export const useFetchZadaraDomains = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["zadara-domains", params],
    queryFn: () => fetchZadaraDomains(params),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateZadaraDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createZadaraDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zadara-domains"] });
    },
    onError: (error) => {
      console.error("Error creating Zadara domain:", error);
    },
  });
};

export const useUpdateZadaraDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateZadaraDomain,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["zadara-domains"] });
      queryClient.invalidateQueries({ queryKey: ["zadara-domain", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating Zadara domain:", error);
    },
  });
};

export const useDeleteZadaraDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteZadaraDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zadara-domains"] });
    },
    onError: (error) => {
      console.error("Error deleting Zadara domain:", error);
    },
  });
};

export const useSyncZadaraDomainPolicies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncZadaraDomainPolicies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zadara-domains"] });
    },
    onError: (error) => {
      console.error("Error syncing Zadara domain policies:", error);
    },
  });
};

export const useAssignZadaraDomainUserPolicies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignZadaraDomainUserPolicies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zadara-domains"] });
      queryClient.invalidateQueries({ queryKey: ["zadara-domain-user-policies"] });
    },
    onError: (error) => {
      console.error("Error assigning Zadara domain user policies:", error);
    },
  });
};

export const useFetchZadaraDomainUserPolicies = (options = {}) => {
  return useQuery({
    queryKey: ["zadara-domain-user-policies"],
    queryFn: fetchZadaraDomainUserPolicies,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchZadaraDomainTenantHierarchy = (tenantId, options = {}) => {
  return useQuery({
    queryKey: ["zadara-domain-tenant-hierarchy", tenantId],
    queryFn: () => fetchZadaraDomainTenantHierarchy(tenantId),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// ================================
// Admin-Only Cloud Endpoints
// ================================

// Cloud Providers (Admin Only)
const fetchAdminCloudProviders = async () => {
  const res = await silentAdminApi("GET", "/cloud-providers");
  if (!res.data) throw new Error("Failed to fetch admin cloud providers");
  return res;
};

const createAdminCloudProvider = async (providerData) => {
  const res = await adminApi("POST", "/cloud-providers", providerData);
  if (!res.data) throw new Error("Failed to create admin cloud provider");
  return res.data;
};

const updateAdminCloudProvider = async ({ id, providerData }) => {
  const res = await adminApi("PUT", `/cloud-providers/${id}`, providerData);
  if (!res.data) throw new Error(`Failed to update admin cloud provider with ID ${id}`);
  return res.data;
};

const deleteAdminCloudProvider = async (id) => {
  const res = await adminApi("DELETE", `/cloud-providers/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin cloud provider with ID ${id}`);
  return res.data;
};

// Cloud Regions (Admin Only)
const fetchAdminCloudRegions = async () => {
  const res = await silentAdminApi("GET", "/cloud-regions");
  if (!res.data) throw new Error("Failed to fetch admin cloud regions");
  return res;
};

const createAdminCloudRegion = async (regionData) => {
  const res = await adminApi("POST", "/cloud-regions", regionData);
  if (!res.data) throw new Error("Failed to create admin cloud region");
  return res.data;
};

const updateAdminCloudRegion = async ({ id, regionData }) => {
  const res = await adminApi("PUT", `/cloud-regions/${id}`, regionData);
  if (!res.data) throw new Error(`Failed to update admin cloud region with ID ${id}`);
  return res.data;
};

const deleteAdminCloudRegion = async (id) => {
  const res = await adminApi("DELETE", `/cloud-regions/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin cloud region with ID ${id}`);
  return res.data;
};

// Cloud Project Regions (Admin Only)
const fetchAdminCloudProjectRegions = async () => {
  const res = await silentAdminApi("GET", "/cloud-project-regions");
  if (!res.data) throw new Error("Failed to fetch admin cloud project regions");
  return res;
};

const fetchAdminCloudProjectRegionById = async (id) => {
  const res = await silentAdminApi("GET", `/cloud-project-regions/${id}`);
  if (!res.data) throw new Error(`Failed to fetch admin cloud project region with ID ${id}`);
  return res.data;
};

const createAdminCloudProjectRegion = async (projectRegionData) => {
  const res = await adminApi("POST", "/cloud-project-regions", projectRegionData);
  if (!res.data) throw new Error("Failed to create admin cloud project region");
  return res.data;
};

const updateAdminCloudProjectRegion = async ({ id, projectRegionData }) => {
  const res = await adminApi("PUT", `/cloud-project-regions/${id}`, projectRegionData);
  if (!res.data) throw new Error(`Failed to update admin cloud project region with ID ${id}`);
  return res.data;
};

const deleteAdminCloudProjectRegion = async (id) => {
  const res = await adminApi("DELETE", `/cloud-project-regions/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin cloud project region with ID ${id}`);
  return res.data;
};

// ================================
// HOOKS - Admin-Only Cloud Endpoints
// ================================

// Cloud Providers Hooks
export const useFetchAdminCloudProviders = (options = {}) => {
  return useQuery({
    queryKey: ["admin-cloud-providers"],
    queryFn: fetchAdminCloudProviders,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateAdminCloudProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminCloudProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-providers"] });
    },
    onError: (error) => {
      console.error("Error creating admin cloud provider:", error);
    },
  });
};

export const useUpdateAdminCloudProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminCloudProvider,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-provider", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating admin cloud provider:", error);
    },
  });
};

export const useDeleteAdminCloudProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminCloudProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-providers"] });
    },
    onError: (error) => {
      console.error("Error deleting admin cloud provider:", error);
    },
  });
};

// Cloud Regions Hooks
export const useFetchAdminCloudRegions = (options = {}) => {
  return useQuery({
    queryKey: ["admin-cloud-regions"],
    queryFn: fetchAdminCloudRegions,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateAdminCloudRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminCloudRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-regions"] });
    },
    onError: (error) => {
      console.error("Error creating admin cloud region:", error);
    },
  });
};

export const useUpdateAdminCloudRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminCloudRegion,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-regions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-region", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating admin cloud region:", error);
    },
  });
};

export const useDeleteAdminCloudRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminCloudRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-regions"] });
    },
    onError: (error) => {
      console.error("Error deleting admin cloud region:", error);
    },
  });
};

// Cloud Project Regions Hooks
export const useFetchAdminCloudProjectRegions = (options = {}) => {
  return useQuery({
    queryKey: ["admin-cloud-project-regions"],
    queryFn: fetchAdminCloudProjectRegions,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchAdminCloudProjectRegionById = (id, options = {}) => {
  return useQuery({
    queryKey: ["admin-cloud-project-region", id],
    queryFn: () => fetchAdminCloudProjectRegionById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateAdminCloudProjectRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminCloudProjectRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-project-regions"] });
    },
    onError: (error) => {
      console.error("Error creating admin cloud project region:", error);
    },
  });
};

export const useUpdateAdminCloudProjectRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminCloudProjectRegion,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-project-regions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-project-region", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating admin cloud project region:", error);
    },
  });
};

export const useDeleteAdminCloudProjectRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminCloudProjectRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-project-regions"] });
    },
    onError: (error) => {
      console.error("Error deleting admin cloud project region:", error);
    },
  });
};

// ================================
// Combined Admin Operations Hook
// ================================

// Hook that provides access to all admin operations
export const useAdminOperations = () => {
  const queryClient = useQueryClient();
  
  const invalidateAllAdminData = () => {
    queryClient.invalidateQueries({ queryKey: ["tenants"] });
    queryClient.invalidateQueries({ queryKey: ["sub-tenants"] });
    queryClient.invalidateQueries({ queryKey: ["regions"] });
    queryClient.invalidateQueries({ queryKey: ["admin-product-pricing"] });
    queryClient.invalidateQueries({ queryKey: ["zadara-domains"] });
  };

  return {
    // Tenant operations
    createTenant: useCreateTenant(),
    updateTenant: useUpdateTenant(),
    deleteTenant: useDeleteTenant(),
    
    // Sub-tenant operations  
    createSubTenant: useCreateSubTenant(),
    
    // Region operations
    createRegion: useCreateRegion(),
    updateRegion: useUpdateRegion(),
    deleteRegion: useDeleteRegion(),
    
    // Product pricing operations
    createAdminProductPricing: useCreateAdminProductPricing(),
    importAdminProductPricing: useImportAdminProductPricing(),
    
    // Provider operations
    createProviderRegionCredential: useCreateProviderRegionCredential(),
    resetProviderRegionCredentialPassword: useResetProviderRegionCredentialPassword(),
    
    // Discovery operations
    importProviderDiscoveryProjects: useImportProviderDiscoveryProjects(),
    syncProviderDiscoveryProjects: useSyncProviderDiscoveryProjects(),
    
    // Zadara operations
    createZadaraDomain: useCreateZadaraDomain(),
    updateZadaraDomain: useUpdateZadaraDomain(),
    deleteZadaraDomain: useDeleteZadaraDomain(),
    syncZadaraDomainPolicies: useSyncZadaraDomainPolicies(),
    assignZadaraDomainUserPolicies: useAssignZadaraDomainUserPolicies(),
    
    // Admin-only Cloud operations
    createAdminCloudProvider: useCreateAdminCloudProvider(),
    updateAdminCloudProvider: useUpdateAdminCloudProvider(),
    deleteAdminCloudProvider: useDeleteAdminCloudProvider(),
    createAdminCloudRegion: useCreateAdminCloudRegion(),
    updateAdminCloudRegion: useUpdateAdminCloudRegion(),
    deleteAdminCloudRegion: useDeleteAdminCloudRegion(),
    createAdminCloudProjectRegion: useCreateAdminCloudProjectRegion(),
    updateAdminCloudProjectRegion: useUpdateAdminCloudProjectRegion(),
    deleteAdminCloudProjectRegion: useDeleteAdminCloudProjectRegion(),
    
    // Utility functions
    invalidateAllAdminData,
  };
};

// Export individual functions for direct use if needed
export {
  fetchTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  fetchSubTenants,
  createSubTenant,
  fetchRegions,
  createRegion,
  updateRegion,
  deleteRegion,
  fetchAdminProductPricing,
  createAdminProductPricing,
  importAdminProductPricing,
  exportAdminProductPricingTemplate,
  fetchProviderRegionCredentials,
  createProviderRegionCredential,
  resetProviderRegionCredentialPassword,
  fetchProviderDiscoveryProjects,
  importProviderDiscoveryProjects,
  syncProviderDiscoveryProjects,
  fetchZadaraDomains,
  createZadaraDomain,
  updateZadaraDomain,
  deleteZadaraDomain,
  syncZadaraDomainPolicies,
  assignZadaraDomainUserPolicies,
  fetchZadaraDomainUserPolicies,
  fetchZadaraDomainTenantHierarchy,
  fetchAdminCloudProviders,
  createAdminCloudProvider,
  updateAdminCloudProvider,
  deleteAdminCloudProvider,
  fetchAdminCloudRegions,
  createAdminCloudRegion,
  updateAdminCloudRegion,
  deleteAdminCloudRegion,
  fetchAdminCloudProjectRegions,
  fetchAdminCloudProjectRegionById,
  createAdminCloudProjectRegion,
  updateAdminCloudProjectRegion,
  deleteAdminCloudProjectRegion
};
