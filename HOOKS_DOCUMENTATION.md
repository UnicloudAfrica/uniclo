# UCA Frontend Hooks Documentation

## Overview

This document provides comprehensive documentation for all frontend API hooks that correspond to the backend endpoints defined in `api.php`, `tenant.php`, and `admin.php`. The hooks are organized into shared resources and context-specific hooks for better maintainability and reusability.

## Architecture

### Shared Resource Hooks (`sharedResourceHooks.js`)

These hooks work across all three contexts (business/client, tenant admin, and admin) by using different API clients based on the context:

- **Business/Client context**: Uses `api` and `silentApi`
- **Admin context**: Uses `adminApi` and `silentAdminApi`  
- **Tenant context**: Uses `tenantApi` and `silentTenantApi`

#### Multi-Instance Operations
These are the primary instance creation and management endpoints that use multi-instance architecture:

**Business/Client Hooks:**
- `useCreateMultiInstance()` - Create multiple instances
- `usePreviewMultiInstancePricing()` - Preview pricing for multi-instance setup
- `useFetchMultiInstanceResources()` - Get available resources for multi-instance
- `useValidateMultiInstanceConfiguration()` - Validate multi-instance configuration
- `useCreateMultiInstancePreview()` - Create preview of multi-instance setup

**Admin Hooks:**
- `useAdminCreateMultiInstance()` - Admin version of multi-instance creation
- `useAdminPreviewMultiInstancePricing()` - Admin version of pricing preview
- `useFetchAdminMultiInstanceResources()` - Admin version of resource fetching
- `useValidateAdminMultiInstanceConfiguration()` - Admin configuration validation
- `useCreateAdminMultiInstancePreview()` - Admin preview creation

**Tenant Hooks:**
- `useTenantCreateMultiInstance()` - Tenant version of multi-instance creation
- `useTenantPreviewMultiInstancePricing()` - Tenant version of pricing preview
- `useFetchTenantMultiInstanceResources()` - Tenant version of resource fetching
- `useValidateTenantMultiInstanceConfiguration()` - Tenant configuration validation
- `useCreateTenantMultiInstancePreview()` - Tenant preview creation

#### Instance Lifecycle Operations
Management of instance lifecycles across all contexts:

**Business/Client Hooks:**
- `useFetchInstanceLifecycleById(identifier)` - Fetch lifecycle by identifier
- `useCreateInstanceLifecycle()` - Create new instance lifecycle
- `useDeleteInstanceLifecycle()` - Delete instance lifecycle

**Admin Hooks:**
- `useAdminFetchInstanceLifecycleById(identifier)` - Admin version of lifecycle fetching
- `useCreateAdminInstanceLifecycle()` - Admin lifecycle creation
- `useDeleteAdminInstanceLifecycle()` - Admin lifecycle deletion

**Tenant Hooks:**
- `useTenantFetchInstanceLifecycleById(identifier)` - Tenant version of lifecycle fetching
- `useCreateTenantInstanceLifecycle()` - Tenant lifecycle creation
- `useDeleteTenantInstanceLifecycle()` - Tenant lifecycle deletion

#### Instance Console Operations
Console access management across all contexts:

**Business/Client Hooks:**
- `useFetchInstanceConsoleById(id)` - Fetch console details by ID

**Admin Hooks:**
- `useFetchAdminInstanceConsoleById(id)` - Admin version of console fetching

**Tenant Hooks:**
- `useFetchTenantInstanceConsoleById(id)` - Tenant version of console fetching

### Context-Specific Hooks

#### Business/Client Hooks (`businessClientHooks.js`)

These hooks handle business/client-specific endpoints from `api.php` (`/api/v1/business/*`):

##### Public Endpoints (No Authentication Required)
- `useFetchCalculatorOptions()` - Calculator configuration options
- `useFetchProductPricing()` - Product pricing catalog
- `useCreateMultiQuote()` - Create multi-service quotes
- `useFetchAppSettings()` - Application settings
- `useFetchCountries()` - Countries list
- `useFetchCountryById(id)` - Individual country details
- `useFetchStateById(id)` - State details by ID
- `useFetchIndustries()` - Available industries
- `useFetchProductOffers()` - Product offers catalog
- `useFetchProductOfferById(id)` - Individual product offer
- `useFetchProductBandwidth()` - Bandwidth options
- `useFetchProductOsImages()` - OS images catalog
- `useFetchProductComputeInstances()` - Compute instance types
- `useFetchProductVolumeTypes()` - Volume type options
- `useFetchProductCrossConnect()` - Cross connect options
- `useFetchProductFloatingIp()` - Floating IP options
- `useFetchProductFloatingIpById(id)` - Individual floating IP details

##### Pricing and Leads
- `useCreatePricingCalculatorLead()` - Submit pricing calculator leads
- `useCreateBusinessVerification()` - Submit business verification requests
- `useCalculatePricing()` - Calculate pricing for configurations

##### Authentication Endpoints
- `useBusinessLogin()` - Business login
- `useBusinessRegister()` - Business registration
- `useBusinessForgotPassword()` - Password recovery
- `useBusinessSendEmail()` - Send verification emails
- `useBusinessVerifyEmail()` - Email verification
- `useBusinessResetPasswordOtp()` - Reset password with OTP

##### Two-Factor Authentication
- `useSetup2FA()` - Setup 2FA
- `useDisable2FA()` - Disable 2FA
- `useEnable2FA()` - Enable 2FA

##### Profile Management
- `useFetchProfile()` - Fetch business profile
- `useCreateProfile()` - Create business profile
- `useFetchProfileById(id)` - Fetch profile by ID
- `useDeleteProfile()` - Delete profile

##### Transaction Management
- `useFetchTransactions(params)` - Fetch transaction history
- `useFetchTransactionById(id)` - Fetch individual transaction
- `useCreateTransactionReverification()` - Request transaction reverification

##### Quote Management
- `usePreviewQuote()` - Preview quote calculations

#### Admin Hooks (`adminHooks.js`)

These hooks handle admin-specific endpoints from `admin.php` (`/admin/v1/*`):

##### Tenant Management
- `useFetchTenants(params)` - List all tenants with filtering
- `useCreateTenant()` - Create new tenant
- `useFetchTenantById(id)` - Fetch individual tenant
- `useUpdateTenant()` - Update tenant information
- `useDeleteTenant()` - Delete tenant

##### Sub-Tenant Management
- `useFetchSubTenants(params)` - List sub-tenants
- `useCreateSubTenant()` - Create sub-tenant
- `useFetchSubTenantById(id)` - Fetch sub-tenant details
- `useUpdateSubTenant()` - Update sub-tenant
- `useDeleteSubTenant()` - Delete sub-tenant

##### Tenant Client Management
- `useFetchTenantClientById(id)` - Fetch tenant client details

##### Region Management
- `useFetchRegions(params)` - List regions
- `useCreateRegion()` - Create new region
- `useFetchRegionById(id)` - Fetch region details
- `useUpdateRegion()` - Update region
- `useDeleteRegion()` - Delete region

##### Product Pricing Management
- `useFetchAdminProductPricing(params)` - Admin product pricing list
- `useCreateAdminProductPricing()` - Create product pricing
- `useFetchAdminProductPricingById(id)` - Individual pricing details
- `useUpdateAdminProductPricing()` - Update pricing
- `useDeleteAdminProductPricing()` - Delete pricing
- `useExportAdminProductPricingTemplate()` - Export pricing template
- `useImportAdminProductPricing()` - Import pricing data

##### Provider Region Credentials
- `useFetchProviderRegionCredentials()` - List provider credentials
- `useCreateProviderRegionCredential()` - Create credentials
- `useResetProviderRegionCredentialPassword()` - Reset credential passwords
- `useLinkProviderRegionCredentialUser()` - Link user to credentials

##### Provider Discovery
- `useFetchProviderDiscoveryProjects()` - Discovery project listing
- `useImportProviderDiscoveryProjects()` - Import discovery projects
- `useSyncProviderDiscoveryProjects()` - Sync discovery projects
- `useFetchProviderDiscoveryUsers()` - Discovery user listing
- `useFetchProviderDiscoveryRuns()` - Discovery run history

##### Zadara Domain Management
- `useFetchZadaraDomains(params)` - Zadara domain listing
- `useCreateZadaraDomain()` - Create Zadara domain
- `useFetchZadaraDomainById(id)` - Individual domain details
- `useUpdateZadaraDomain()` - Update Zadara domain
- `useDeleteZadaraDomain()` - Delete domain
- `useSyncZadaraDomainPolicies()` - Sync domain policies
- `useAssignZadaraDomainUserPolicies()` - Assign user policies
- `useFetchZadaraDomainUserPolicies()` - List user policies
- `useFetchZadaraDomainTenantHierarchy(tenantId)` - Tenant hierarchy

##### Admin-Only Cloud Endpoints
These endpoints are exclusive to admin context:

- `useFetchAdminCloudProviders()` - List cloud providers (admin-only)
- `useCreateAdminCloudProvider()` - Create cloud provider
- `useUpdateAdminCloudProvider()` - Update cloud provider
- `useDeleteAdminCloudProvider()` - Delete cloud provider
- `useFetchAdminCloudRegions()` - List cloud regions (admin-only)
- `useCreateAdminCloudRegion()` - Create cloud region
- `useUpdateAdminCloudRegion()` - Update cloud region
- `useDeleteAdminCloudRegion()` - Delete cloud region
- `useFetchAdminCloudProjectRegions()` - List project regions (admin-only)
- `useFetchAdminCloudProjectRegionById(id)` - Individual project region
- `useCreateAdminCloudProjectRegion()` - Create project region
- `useUpdateAdminCloudProjectRegion()` - Update project region
- `useDeleteAdminCloudProjectRegion()` - Delete project region

#### Tenant Admin Hooks (`tenantAdminHooks.js`)

These hooks handle tenant admin endpoints from `tenant.php` (`/tenant/v1/admin/*`):

##### Tax Management
- `useFetchTaxTypes(params)` - List tax types
- `useCreateTaxType()` - Create tax type
- `useFetchTaxTypeById(id)` - Individual tax type
- `useUpdateTaxType()` - Update tax type
- `useDeleteTaxType()` - Delete tax type

##### Dashboard
- `useFetchTenantDashboard()` - Tenant dashboard data

##### Tax Configuration
- `useFetchTaxConfigurations(params)` - List tax configurations
- `useCreateTaxConfiguration()` - Create tax configuration
- `useFetchTaxConfigurationById(id)` - Individual tax configuration
- `useUpdateTaxConfiguration()` - Update tax configuration
- `useDeleteTaxConfiguration()` - Delete tax configuration

##### Product Pricing (Tenant-specific)
- `useFetchTenantProductPricing(params)` - Tenant product pricing
- `useCreateTenantProductPricing()` - Create tenant pricing
- `useFetchTenantProductPricingById(id)` - Individual tenant pricing
- `useUpdateTenantProductPricing()` - Update tenant pricing
- `useDeleteTenantProductPricing()` - Delete tenant pricing
- `useImportTenantProductPricing()` - Import tenant pricing data

##### Profile Management
- `useFetchTenantProfile()` - Tenant profile
- `useCreateTenantProfile()` - Create tenant profile

##### Image Management
- `useFetchTenantImages()` - Available images for tenant

##### Instance Types
- `useFetchTenantInstanceTypes()` - Instance types for tenant

##### Multi Initiation Previews
- `useCreateTenantMultiInitiationPreview()` - Create initiation preview

##### User Profile Management
- `useFetchTenantUserProfiles()` - List user profiles
- `useCreateTenantUserProfile()` - Create user profile
- `useFetchTenantUserProfileById(id)` - Individual user profile
- `useDeleteTenantUserProfile()` - Delete user profile

##### Workspace Management
- `useFetchTenantWorkspaces()` - List workspaces
- `useCreateTenantWorkspace()` - Create workspace
- `useFetchTenantWorkspaceById(id)` - Individual workspace
- `useDeleteTenantWorkspace()` - Delete workspace

##### Domain Settings
- `useFetchTenantDomainSettings()` - Domain settings
- `useCreateTenantDomainSetting()` - Create domain setting
- `useUpdateTenantDomainSetting()` - Update domain setting
- `useDeleteTenantDomainSetting()` - Delete domain setting

## Usage Examples

### Using Shared Resource Hooks

```javascript
import { 
  useCreateMultiInstance, 
  useAdminCreateMultiInstance, 
  useTenantCreateMultiInstance 
} from '../hooks';

// Business/Client context
function BusinessComponent() {
  const createInstance = useCreateMultiInstance();
  
  const handleCreate = (instanceData) => {
    createInstance.mutate(instanceData);
  };
  
  return <button onClick={() => handleCreate(data)}>Create Instance</button>;
}

// Admin context
function AdminComponent() {
  const createInstance = useAdminCreateMultiInstance();
  
  const handleCreate = (instanceData) => {
    createInstance.mutate(instanceData);
  };
  
  return <button onClick={() => handleCreate(data)}>Admin Create Instance</button>;
}
```

### Context-Specific Hooks

```javascript
import { useFetchTenants, useFetchTenantDashboard } from '../hooks';

// Admin-only hook
function AdminTenantsComponent() {
  const { data: tenants, isLoading } = useFetchTenants();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {tenants?.data?.map(tenant => (
        <div key={tenant.id}>{tenant.name}</div>
      ))}
    </div>
  );
}

// Tenant-specific hook
function TenantDashboardComponent() {
  const { data: dashboard, isLoading } = useFetchTenantDashboard();
  
  if (isLoading) return <div>Loading...</div>;
  
  return <div>Revenue: {dashboard?.revenue}</div>;
}
```

## Import Organization

All hooks can be imported from the main index file:

```javascript
// Import all hooks
import * from '../hooks';

// Or import specific context hooks
import * as businessHooks from '../hooks/businessClientHooks';
import * as adminHooks from '../hooks/adminHooks';
import * as tenantHooks from '../hooks/tenantAdminHooks';
import * as sharedHooks from '../hooks/sharedResourceHooks';
```

## Cache Management

### Query Invalidation

Most mutation hooks automatically invalidate related queries:

```javascript
const updateTenant = useUpdateTenant();

updateTenant.mutate(
  { id: 1, tenantData: { name: 'Updated Name' } },
  {
    onSuccess: () => {
      // Automatically invalidates:
      // - ['tenants'] query
      // - ['tenant', 1] query
    }
  }
);
```

### Manual Cache Management

Use the combined operations hooks for advanced cache management:

```javascript
import { useAdminOperations } from '../hooks';

function AdminManagementComponent() {
  const adminOps = useAdminOperations();
  
  const handleBulkUpdate = async () => {
    // Perform multiple operations
    await adminOps.createTenant.mutateAsync(tenantData);
    await adminOps.createRegion.mutateAsync(regionData);
    
    // Invalidate all admin data
    adminOps.invalidateAllAdminData();
  };
}
```

## Error Handling

All hooks include built-in error handling and logging:

```javascript
const createTenant = useCreateTenant();

const handleSubmit = (tenantData) => {
  createTenant.mutate(tenantData, {
    onError: (error) => {
      // Hook already logs: "Error creating tenant: {error}"
      // Add custom error handling here
      toast.error('Failed to create tenant');
    },
    onSuccess: (data) => {
      toast.success('Tenant created successfully');
    }
  });
};
```

## Endpoint Coverage Status

### ✅ Fully Covered
- Multi-instance operations (shared)
- Instance lifecycle management (shared)  
- Instance console access (shared)
- Admin tenant/sub-tenant management
- Admin region management
- Admin product pricing management
- Admin provider credentials and discovery
- Admin Zadara domain management
- Admin cloud endpoints (providers, regions, project-regions)
- Tenant admin tax management
- Tenant admin dashboard
- Tenant admin product pricing
- Tenant admin profile and user management
- Business/client authentication and 2FA
- Business/client profile management
- Business/client transaction management
- Business/client product catalogs and pricing
- Public calculator and quote endpoints

### ⚠️ Missing/Needs Verification
Based on route analysis, the following endpoints mentioned in the conversation summary may not exist as separate routes or need verification:
- `business-verifications` - May be handled by existing verification controllers
- `pricing-calculator-leads` - May be handled by existing lead controllers

## Notes

1. **API Client Selection**: The shared resource hooks automatically select the appropriate API client based on the hook prefix (no prefix = business, admin prefix = admin, tenant prefix = tenant).

2. **Route Context**: All hooks respect the backend route structure where shared resources use different controller namespaces based on context while maintaining the same API surface.

3. **Middleware Compatibility**: Hooks are designed to work with the backend's middleware stack including authentication, tenant resolution, and Zadara authentication where applicable.

4. **Cache Keys**: Query keys are designed to avoid conflicts between contexts (e.g., "admin-cloud-providers" vs "cloud-providers").

5. **TypeScript Support**: All hooks can be extended with TypeScript interfaces for better type safety.