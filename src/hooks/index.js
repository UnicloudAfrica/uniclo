/**
 * Enhanced UCA Frontend Hooks Index
 * 
 * This file exports all the enhanced and new hooks created to complement
 * the backend API endpoints. Import from here for better organization.
 */

// Console Access Hooks
export * from './consoleHooks';

// Advanced VPC Feature Hooks
export * from './advancedVpcHooks';

// Enhanced Volume Management Hooks
export * from './enhancedVolumeHooks';

// Settings Management Hooks
export * from './settingsHooks';

// Enhanced VPC Hooks (existing but improved)
export * from './vpcHooks';

// Existing hooks (re-exported for convenience)
export * from './authHooks';
export * from './instancesHook';
export * from './elasticIPHooks';
export * from './internetGatewayHooks';
export * from './keyPairsHook';
export * from './securityGroupHooks';
export * from './subnetHooks';
export * from './transactionHooks';
export * from './volumeHooks';

// Admin hooks (if they exist)
export * from './adminHooks/keyPairHooks';
export * from './adminHooks/routeTableHooks';
export * from './adminHooks/networkHooks';
export * from './adminHooks/subnetHooks';
export * from './adminHooks/securityGroupHooks';
export * from './adminHooks/vcpHooks';
export * from './adminHooks/eipHooks';
export * from './adminHooks/igwHooks';

// Client hooks
export * from './clientHooks/projectHooks';
export * from './clientHooks/elasticIPHooks';
export * from './clientHooks/keyPairsHook';
export * from './clientHooks/securityGroupHooks';
export * from './clientHooks/supportHooks';
export * from './clientHooks/vpcHooks';
export * from './clientHooks/subnetHooks';
export * from './clientHooks/instanceHooks';
export * from './clientHooks/transactionHooks';
export * from './clientHooks/profileHooks';

// Utility hooks
export * from './businessHooks';
export * from './cartHooks';
export * from './modulesHook';
export * from './subscriptionHooks';