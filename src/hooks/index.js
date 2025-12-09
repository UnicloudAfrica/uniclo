/**
 * Comprehensive UCA Frontend Hooks Index
 *
 * This file exports ALL frontend hooks that align with backend API endpoints
 * from api.php, tenant.php, and admin.php routes. Import from here for better organization.
 */

// ================================
// SHARED RESOURCE HOOKS
// ================================

// Shared hooks that work across all contexts (business/client, tenant, admin)
export * from "./sharedResourceHooks";

// ================================
// CONTEXT-SPECIFIC API HOOKS
// ================================

// Business/Client API Hooks (api.php - /api/v1/business/*)
// Note: Multi-instances, instance lifecycles, and instance consoles are now in sharedResourceHooks
export * from "./businessClientHooks";

// Tenant Admin Hooks (tenant.php - /tenant/v1/admin/*)
// Note: Multi-instances, instance lifecycles, and instance consoles are now in sharedResourceHooks
export * from "./tenantAdminHooks";

// Admin Hooks (admin.php - /admin/v1/*)
// Note: Multi-instances, instance lifecycles, and instance consoles are now in sharedResourceHooks
// Cloud endpoints (providers, regions, project-regions) are admin-only and remain here
export * from "./adminHooks";

// ================================
// ENHANCED FEATURE HOOKS
// ================================

// Console Access Hooks
export * from "./consoleHooks";

// Advanced VPC Feature Hooks
export * from "./advancedVpcHooks";

// Enhanced Volume Management Hooks
export * from "./enhancedVolumeHooks";

// Settings Management Hooks
export * from "./settingsHooks";

// Enhanced VPC Hooks (existing but improved)
export * from "./vpcHooks";

// Existing hooks (re-exported for convenience)
export * from "./authHooks";
export * from "./instancesHook";
export * from "./elasticIPHooks";
export * from "./internetGatewayHooks";
export * from "./keyPairsHook";
export * from "./securityGroupHooks";
export * from "./subnetHooks";
export * from "./transactionHooks";
export * from "./volumeHooks";

// Admin hooks (if they exist)
export * from "./adminHooks/keyPairHooks";
export * from "./adminHooks/routeTableHooks";
export * from "./adminHooks/networkHooks";
export * from "./adminHooks/subnetHooks";
export * from "./adminHooks/securityGroupHooks";
export * from "./adminHooks/vcpHooks";
export * from "./adminHooks/eipHooks";
export * from "./adminHooks/igwHooks";

// Client hooks
export * from "./clientHooks/projectHooks";
export * from "./clientHooks/elasticIPHooks";
export * from "./clientHooks/keyPairsHook";
export * from "./clientHooks/securityGroupHooks";
export * from "./clientHooks/supportHooks";
export * from "./clientHooks/vpcHooks";
export * from "./clientHooks/subnetHooks";
export * from "./clientHooks/instanceHooks";
export * from "./clientHooks/transactionHooks";
export * from "./clientHooks/profileHooks";
export * from "./clientHooks/settingsHooks";
export * from "./clientHooks/edgeHooks";
export * from "./clientHooks/productsHook";
export * from "./clientHooks/calculatorHook";

// Utility hooks
export * from "./businessHooks";
export * from "./cartHooks";
export * from "./modulesHook";
export * from "./subscriptionHooks";
