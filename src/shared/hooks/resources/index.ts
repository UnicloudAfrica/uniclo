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
} from "./managedDatabaseHooks";

// Re-export factory and types for custom resource hooks
export { createResourceHooks, createQueryKeys } from "../createResourceHooks";
export type { ResourceHooks } from "../createResourceHooks";
