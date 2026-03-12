/**
 * Combined admin operations hook from the original adminHooks.ts god file.
 * Provides access to all admin mutation operations in a single hook.
 */
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
  useCreateSubTenant,
} from "./tenantLegacyHooks";
import { useCreateRegion, useUpdateRegion, useDeleteRegion } from "./regionLegacyHooks";
import {
  useCreateAdminProductPricing,
  useImportAdminProductPricing,
} from "./productPricingLegacyHooks";
import {
  useCreateProviderRegionCredential,
  useResetProviderRegionCredentialPassword,
} from "./providerCredentialHooks";
import {
  useImportProviderDiscoveryProjects,
  useSyncProviderDiscoveryProjects,
} from "./providerDiscoveryHooks";
import {
  useCreateZadaraDomain,
  useUpdateZadaraDomain,
  useDeleteZadaraDomain,
  useSyncZadaraDomainPolicies,
  useAssignZadaraDomainUserPolicies,
} from "./zadaraDomainLegacyHooks";
import {
  useCreateAdminCloudProvider,
  useUpdateAdminCloudProvider,
  useDeleteAdminCloudProvider,
  useCreateAdminCloudRegion,
  useUpdateAdminCloudRegion,
  useDeleteAdminCloudRegion,
  useCreateAdminCloudProjectRegion,
  useUpdateAdminCloudProjectRegion,
  useDeleteAdminCloudProjectRegion,
} from "./cloudEndpointHooks";

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
