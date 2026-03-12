/**
 * Barrel re-export for admin hooks.
 *
 * This file used to contain all admin hooks in a single 1374-line file.
 * The hooks have been split into domain-specific files under ./adminHooks/.
 * All original exports are preserved via re-exports below.
 */

// ================================
// Tenant / Sub-Tenant hooks & API functions (legacy QueryParams versions)
// ================================
export {
  useFetchTenants,
  useCreateTenant,
  useFetchTenantById,
  useUpdateTenant,
  useDeleteTenant,
  useFetchSubTenants,
  useCreateSubTenant,
  fetchTenants,
  createTenant,
  fetchTenantById,
  updateTenant,
  deleteTenant,
  fetchSubTenants,
  createSubTenant,
  fetchSubTenantById,
  updateSubTenant,
  deleteSubTenant,
  fetchTenantClientById,
} from "./adminHooks/tenantLegacyHooks";

// ================================
// Region hooks & API functions (legacy QueryParams versions)
// ================================
export {
  useFetchRegions,
  useCreateRegion,
  useUpdateRegion,
  useDeleteRegion,
  fetchRegions,
  fetchRegionById,
  createRegion,
  updateRegion,
  deleteRegion,
} from "./adminHooks/regionLegacyHooks";

// ================================
// Product Pricing hooks & API functions (legacy)
// ================================
export {
  useFetchAdminProductPricing,
  useCreateAdminProductPricing,
  useExportAdminProductPricingTemplate,
  useImportAdminProductPricing,
  fetchAdminProductPricing,
  fetchAdminProductPricingById,
  createAdminProductPricing,
  updateAdminProductPricing,
  deleteAdminProductPricing,
  importAdminProductPricing,
  exportAdminProductPricingTemplate,
} from "./adminHooks/productPricingLegacyHooks";

// ================================
// Provider Region Credentials hooks & API functions
// ================================
export {
  useFetchProviderRegionCredentials,
  useCreateProviderRegionCredential,
  useResetProviderRegionCredentialPassword,
  fetchProviderRegionCredentials,
  createProviderRegionCredential,
  resetProviderRegionCredentialPassword,
  linkProviderRegionCredentialUser,
  rotateProviderRegionCredentialIfMissing,
  reconcileProviderRegionCredentials,
} from "./adminHooks/providerCredentialHooks";

// ================================
// Provider Discovery hooks & API functions
// ================================
export {
  useFetchProviderDiscoveryProjects,
  useImportProviderDiscoveryProjects,
  useSyncProviderDiscoveryProjects,
  useFetchProviderDiscoveryUsers,
  useFetchProviderDiscoveryRuns,
  fetchProviderDiscoveryProjects,
  fetchProviderDiscoveryProjectsDrift,
  importProviderDiscoveryProjects,
  syncProviderDiscoveryProjects,
  fetchProviderDiscoveryUsers,
  linkProviderDiscoveryUsers,
  fetchProviderDiscoveryRuns,
  fetchProviderDiscoveryRunById,
  createProjectUserSync,
} from "./adminHooks/providerDiscoveryHooks";

// ================================
// Zadara Domain hooks & API functions (legacy)
// ================================
export {
  useFetchZadaraDomains,
  useCreateZadaraDomain,
  useUpdateZadaraDomain,
  useDeleteZadaraDomain,
  useSyncZadaraDomainPolicies,
  useAssignZadaraDomainUserPolicies,
  useFetchZadaraDomainUserPolicies,
  useFetchZadaraDomainTenantHierarchy,
  fetchZadaraDomains,
  fetchZadaraDomainById,
  createZadaraDomain,
  updateZadaraDomain,
  deleteZadaraDomain,
  syncZadaraDomainPolicies,
  assignZadaraDomainUserPolicies,
  fetchZadaraDomainUserPolicies,
  fetchZadaraDomainTenantHierarchy,
} from "./adminHooks/zadaraDomainLegacyHooks";

// ================================
// Admin Cloud Endpoint hooks & API functions
// ================================
export {
  useFetchAdminCloudProviders,
  useCreateAdminCloudProvider,
  useUpdateAdminCloudProvider,
  useDeleteAdminCloudProvider,
  useFetchAdminCloudRegions,
  useCreateAdminCloudRegion,
  useUpdateAdminCloudRegion,
  useDeleteAdminCloudRegion,
  useFetchAdminCloudProjectRegions,
  useFetchAdminCloudProjectRegionById,
  useCreateAdminCloudProjectRegion,
  useUpdateAdminCloudProjectRegion,
  useDeleteAdminCloudProjectRegion,
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
  deleteAdminCloudProjectRegion,
} from "./adminHooks/cloudEndpointHooks";

// ================================
// Product Offers API functions (no hooks)
// ================================
export {
  fetchAdminProductOffers,
  createAdminProductOffer,
  fetchAdminProductOfferById,
  updateAdminProductOffer,
  deleteAdminProductOffer,
} from "./adminHooks/productOfferHooks";

// ================================
// Miscellaneous admin API functions
// ================================
export {
  fetchAdminTaxConfigurations,
  createAdminTaxConfiguration,
  fetchAdminTaxConfigurationById,
  updateAdminTaxConfiguration,
  deleteAdminTaxConfiguration,
  fetchColocationSettings,
  createColocationSetting,
  fetchAdminProducts,
  createAdminProduct,
  fetchAdminProductById,
  updateAdminProduct,
  deleteAdminProduct,
  fetchAdminProductComputeInstances,
  createAdminProductComputeInstance,
  createAdminMultiInitiationPreview,
} from "./adminHooks/miscAdminHooks";

// ================================
// Combined Admin Operations Hook
// ================================
export { useAdminOperations } from "./adminHooks/adminOperationsHook";
