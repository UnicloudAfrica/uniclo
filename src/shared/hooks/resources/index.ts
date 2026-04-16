/**
 * Barrel export for all context-aware resource hooks.
 *
 * Usage:
 *   import { useFetchSecurityGroups, useFetchSubnets } from "@/shared/hooks/resources";
 *
 * Each hook automatically detects the current dashboard context (admin/tenant/client)
 * via `useApiContext()` and routes to the correct API endpoint.
 */

// Security Groups
export {
  useFetchSecurityGroups,
  useFetchSecurityGroupById,
  useCreateSecurityGroup,
  useUpdateSecurityGroup,
  useDeleteSecurityGroup,
  useSyncSecurityGroups,
  securityGroupKeys,
} from "./securityGroupHooks";

// Subnets
export {
  useFetchSubnets,
  useFetchSubnetById,
  useCreateSubnet,
  useUpdateSubnet,
  useDeleteSubnet,
  useSyncSubnets,
  subnetKeys,
} from "./subnetHooks";

// VPCs
export {
  useFetchVpcs,
  useFetchVpcById,
  useCreateVpc,
  useUpdateVpc,
  useDeleteVpc,
  useSyncVpcs,
  vpcKeys,
} from "./vpcHooks";

// Internet Gateways
export {
  useFetchIgws,
  useFetchIgwById,
  useCreateIgw,
  useUpdateIgw,
  useDeleteIgw,
  useSyncIgws,
  igwKeys,
} from "./igwHooks";

// Elastic IPs
export {
  useFetchElasticIps,
  useFetchElasticIpById,
  useCreateElasticIp,
  useUpdateElasticIp,
  useDeleteElasticIp,
  useSyncElasticIps,
  elasticIpKeys,
} from "./eipHooks";

// Route Tables
export {
  useFetchRouteTables,
  useFetchRouteTableById,
  useCreateRouteTable,
  useUpdateRouteTable,
  useDeleteRouteTable,
  useSyncRouteTables,
  routeTableKeys,
} from "./routeTableHooks";

// Network Interfaces / ENIs
export {
  useFetchNetworks,
  useFetchNetworkById,
  useCreateNetwork,
  useUpdateNetwork,
  useDeleteNetwork,
  useSyncNetworks,
  networkKeys,
} from "./networkHooks";

// Instances
export {
  useFetchInstances,
  useFetchInstanceById,
  useCreateInstance,
  useUpdateInstance,
  useDeleteInstance,
  useSyncInstances,
  instanceKeys,
} from "./instanceHooks";

// Projects
export {
  useFetchProjects,
  useFetchProjectById,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useSyncProjects,
  projectKeys,
} from "./projectHooks";

// Regions
export {
  useFetchRegions,
  useFetchRegionById,
  useCreateRegion,
  useUpdateRegion,
  useDeleteRegion,
  regionKeys,
} from "./regionHooks";

// Edge Locations
export {
  useFetchEdgeLocations,
  useFetchEdgeLocationById,
  useCreateEdgeLocation,
  useUpdateEdgeLocation,
  useDeleteEdgeLocation,
  edgeLocationKeys,
} from "./edgeHooks";

// Key Pairs
export {
  useFetchKeyPairs,
  useFetchKeyPairById,
  useCreateKeyPair,
  useUpdateKeyPair,
  useDeleteKeyPair,
  useSyncKeyPairs,
  keyPairKeys,
} from "./keyPairHooks";

// Managed Databases
export {
  useFetchManagedDatabases,
  useFetchManagedDatabaseById,
  useCreateManagedDatabase,
  useUpdateManagedDatabase,
  useDeleteManagedDatabase,
  useSyncManagedDatabases,
  managedDatabaseKeys,
  useFetchDatabaseOperations,
  useFetchDatabaseOperation,
  useRotateDatabaseCredentials,
  useRetryDatabaseOperation,
  useReconcileDatabaseOperation,
} from "./managedDatabaseHooks";

// Integrations (Protection Services)
export {
  useFetchIntegrationOperations,
  useFetchIntegrationOperationById,
  integrationOperationKeys,
} from "./integrationHooks";

// External Endpoints (Migration-as-a-Service)
export {
  useFetchExternalEndpoints,
  useFetchExternalEndpoint,
  useCreateExternalEndpoint,
  useUpdateExternalEndpoint,
  useDeleteExternalEndpoint,
  useTestEndpointConnection,
  useScanEndpointSize,
  externalEndpointKeys,
  externalEndpointExtendedKeys,
} from "./externalEndpointHooks";

// External Migrations (Migration-as-a-Service)
export {
  useFetchExternalMigrations,
  useFetchExternalMigration,
  useEstimateMigrationCost,
  useInitiateExternalMigration,
  useConfirmExternalMigration,
  useCancelExternalMigration,
  usePollMigrationProgress,
  externalMigrationKeys,
  externalMigrationExtendedKeys,
} from "./externalMigrationHooks";

// Kernel Compatibility
export {
  useReplicationPairs,
  useActiveActiveReadiness,
  useCertifyActiveActive,
  useKernelCompatibilityCheck,
  useKernelCompatibilityMatrix,
  useMigrationPreflight,
  useUpdateReplicationSettings,
  useExportSlaReport,
} from "./integrationHooks";

// DR Drill Scheduling
export {
  useConfigureDrillSchedule,
  useDisableDrillSchedule,
} from "./integrationHooks";

// PITR (Point-in-Time Recovery)
export {
  usePitrRange,
  useRestorePitr,
} from "./integrationHooks";
export type { PitrRange } from "./integrationHooks";

// Ransomware Detection
export {
  useRansomwareDashboard,
  useRansomwareScans,
  useAcknowledgeRansomware,
  useRecoverFromRansomware,
} from "./integrationHooks";
export type { RansomwareDashboardData, RansomwareScan } from "./integrationHooks";

// Hypervisor Management
export {
  useDetectHypervisor,
  useHypervisorVMs,
  useHypervisorVM,
  useHypervisorVMAction,
  useEnableHypervisorCBT,
  useHypervisorCBTStatus,
  useMigrateHypervisorVM,
  useHypervisorMigrationProgress,
} from "./integrationHooks";
export type {
  HypervisorDetection,
  HypervisorVM,
  HypervisorMigrationProgress,
} from "./integrationHooks";

// Batch Migrations
export {
  useBatchMigrations,
  useCreateBatchMigration,
  useStartBatchMigration,
  useBatchMigration,
  usePauseBatchMigration,
  useResumeBatchMigration,
  useCancelBatchMigration,
  useRevalidateBatchMigration,
} from "./integrationHooks";

// Database Replication Groups
export {
  useDatabaseReplicationGroups,
  useCreateDatabaseReplicationGroup,
  useDatabaseReplicationGroup,
  useDeleteDatabaseReplicationGroup,
  useAddReplicationTarget,
  usePauseDatabaseReplication,
  useResumeDatabaseReplication,
  useSyncDatabaseReplication,
  useTestDatabaseConnection,
  usePreflightDatabaseReplication,
} from "./integrationHooks";

// Re-export factory and types for custom resource hooks
export { createResourceHooks, createQueryKeys } from "../createResourceHooks";
export type { ResourceHooks } from "../createResourceHooks";
