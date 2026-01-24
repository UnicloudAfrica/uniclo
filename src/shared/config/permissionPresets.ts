// @ts-nocheck
/**
 * Permission presets derived from user hierarchy.
 * These define what actions each role can perform on infrastructure resources.
 */

export type Hierarchy = "admin" | "tenant" | "client";

// ============================================
// Elastic IPs Permissions
// ============================================

export interface ElasticIpPermissions {
  canCreate: boolean;
  canDelete: boolean;
  canAssociate: boolean;
  canDisassociate: boolean;
  canViewAllTenants: boolean;
  canViewAllProjects: boolean;
}

const ELASTIC_IP_PERMISSIONS: Record<Hierarchy, ElasticIpPermissions> = {
  admin: {
    canCreate: true,
    canDelete: true,
    canAssociate: true,
    canDisassociate: true,
    canViewAllTenants: true,
    canViewAllProjects: true,
  },
  tenant: {
    canCreate: true,
    canDelete: true,
    canAssociate: false,
    canDisassociate: true,
    canViewAllTenants: false,
    canViewAllProjects: true,
  },
  client: {
    canCreate: false,
    canDelete: false,
    canAssociate: false,
    canDisassociate: false,
    canViewAllTenants: false,
    canViewAllProjects: false,
  },
};

// ============================================
// Security Groups Permissions
// ============================================

export interface SecurityGroupPermissions {
  canCreate: boolean;
  canDelete: boolean;
  canViewRules: boolean;
  canViewAllTenants: boolean;
  canViewAllProjects: boolean;
}

const SECURITY_GROUP_PERMISSIONS: Record<Hierarchy, SecurityGroupPermissions> = {
  admin: {
    canCreate: true,
    canDelete: true,
    canViewRules: true,
    canViewAllTenants: true,
    canViewAllProjects: true,
  },
  tenant: {
    canCreate: false,
    canDelete: false,
    canViewRules: true,
    canViewAllTenants: false,
    canViewAllProjects: true,
  },
  client: {
    canCreate: false,
    canDelete: false,
    canViewRules: false,
    canViewAllTenants: false,
    canViewAllProjects: false,
  },
};

// ============================================
// Subnets Permissions
// ============================================

export interface SubnetPermissions {
  canCreate: boolean;
  canDelete: boolean;
  showDefaultStats: boolean;
  showDefaultBadge: boolean;
  showVpcColumn: boolean;
}

const SUBNET_PERMISSIONS: Record<Hierarchy, SubnetPermissions> = {
  admin: {
    canCreate: true,
    canDelete: true,
    showDefaultStats: true,
    showDefaultBadge: true,
    showVpcColumn: true,
  },
  tenant: {
    canCreate: true,
    canDelete: true,
    showDefaultStats: false,
    showDefaultBadge: false,
    showVpcColumn: true,
  },
  client: {
    canCreate: false,
    canDelete: false,
    showDefaultStats: false,
    showDefaultBadge: false,
    showVpcColumn: false,
  },
};

// ============================================
// VPCs Permissions
// ============================================

export interface VpcPermissions {
  canCreate: boolean;
  canDelete: boolean;
  canSync: boolean;
  showDefaultBadge: boolean;
}

const VPC_PERMISSIONS: Record<Hierarchy, VpcPermissions> = {
  admin: {
    canCreate: true,
    canDelete: true,
    canSync: false,
    showDefaultBadge: true,
  },
  tenant: {
    canCreate: false,
    canDelete: false,
    canSync: false,
    showDefaultBadge: true,
  },
  client: {
    canCreate: true,
    canDelete: true,
    canSync: true,
    showDefaultBadge: true,
  },
};

// ============================================
// Network Interfaces Permissions
// ============================================

export interface NetworkInterfacePermissions {
  canCreate: boolean;
  canDelete: boolean;
  canAttach: boolean;
  canSync: boolean;
}

const NETWORK_INTERFACE_PERMISSIONS: Record<Hierarchy, NetworkInterfacePermissions> = {
  admin: {
    canCreate: false,
    canDelete: false,
    canAttach: false,
    canSync: true,
  },
  tenant: {
    canCreate: false,
    canDelete: false,
    canAttach: false,
    canSync: false,
  },
  client: {
    canCreate: false,
    canDelete: false,
    canAttach: false,
    canSync: true,
  },
};

// ============================================
// Key Pair Permissions
// ============================================

export interface KeyPairPermissions {
  canCreate: boolean;
  canDelete: boolean;
  canSync: boolean;
}

const KEY_PAIR_PERMISSIONS: Record<Hierarchy, KeyPairPermissions> = {
  admin: {
    canCreate: true,
    canDelete: true,
    canSync: true,
  },
  tenant: {
    canCreate: true,
    canDelete: true,
    canSync: false,
  },
  client: {
    canCreate: true,
    canDelete: true,
    canSync: true,
  },
};

// ============================================
// NAT Gateway Permissions
// ============================================

export interface NatGatewayPermissions {
  canCreate: boolean;
  canDelete: boolean;
}

const NAT_GATEWAY_PERMISSIONS: Record<Hierarchy, NatGatewayPermissions> = {
  admin: {
    canCreate: true,
    canDelete: true,
  },
  tenant: {
    canCreate: false, // Currently read-only in legacy
    canDelete: false,
  },
  client: {
    canCreate: false,
    canDelete: false,
  },
};

// ============================================
// Route Table Permissions
// ============================================

export interface RouteTablePermissions {
  canManageRoutes: boolean;
  canManageAssociations: boolean;
}

const ROUTE_TABLE_PERMISSIONS: Record<Hierarchy, RouteTablePermissions> = {
  admin: {
    canManageRoutes: true,
    canManageAssociations: true,
  },
  tenant: {
    canManageRoutes: true,
    canManageAssociations: true,
  },
  client: {
    canManageRoutes: false,
    canManageAssociations: false,
  },
};

// ============================================
// Internet Gateway Permissions
// ============================================

export interface InternetGatewayPermissions {
  canCreate: boolean;
  canDelete: boolean;
  canAttach: boolean;
  canDetach: boolean;
}

const INTERNET_GATEWAY_PERMISSIONS: Record<Hierarchy, InternetGatewayPermissions> = {
  admin: {
    canCreate: true,
    canDelete: true,
    canAttach: true,
    canDetach: true,
  },
  tenant: {
    canCreate: false, // Tenants usually use existing IGW? Or can they create? Let's check TenantRouteTables... Tenant can add routes to IGW. Usually Admin provisions IGW.
    canDelete: false,
    canAttach: false,
    canDetach: false,
  },
  client: {
    canCreate: false,
    canDelete: false,
    canAttach: false,
    canDetach: false,
  },
};

// ============================================
// Network ACL Permissions
// ============================================

export interface NetworkAclPermissions {
  canCreate: boolean;
  canDelete: boolean;
  canManageRules: boolean;
}

const NETWORK_ACL_PERMISSIONS: Record<Hierarchy, NetworkAclPermissions> = {
  admin: {
    canCreate: true,
    canDelete: true,
    canManageRules: true,
  },
  tenant: {
    canCreate: true,
    canDelete: true,
    canManageRules: true,
  },
  client: {
    canCreate: false,
    canDelete: false,
    canManageRules: false,
  },
};

// ============================================
// Generic Permission Getter
// ============================================

type ResourceType =
  | "elasticIps"
  | "securityGroups"
  | "subnets"
  | "vpcs"
  | "networkInterfaces"
  | "keyPairs"
  | "natGateways"
  | "routeTables"
  | "internetGateways"
  | "networkAcls";

type PermissionMap = {
  elasticIps: ElasticIpPermissions;
  securityGroups: SecurityGroupPermissions;
  subnets: SubnetPermissions;
  vpcs: VpcPermissions;
  networkInterfaces: NetworkInterfacePermissions;
  keyPairs: KeyPairPermissions;
  natGateways: NatGatewayPermissions;
  routeTables: RouteTablePermissions;
  internetGateways: InternetGatewayPermissions;
  networkAcls: NetworkAclPermissions;
};

const PERMISSION_PRESETS: Record<ResourceType, Record<Hierarchy, any>> = {
  elasticIps: ELASTIC_IP_PERMISSIONS,
  securityGroups: SECURITY_GROUP_PERMISSIONS,
  subnets: SUBNET_PERMISSIONS,
  vpcs: VPC_PERMISSIONS,
  networkInterfaces: NETWORK_INTERFACE_PERMISSIONS,
  keyPairs: KEY_PAIR_PERMISSIONS,
  natGateways: NAT_GATEWAY_PERMISSIONS,
  routeTables: ROUTE_TABLE_PERMISSIONS,
  internetGateways: INTERNET_GATEWAY_PERMISSIONS,
  networkAcls: NETWORK_ACL_PERMISSIONS,
};

/**
 * Get permissions for a resource based on user hierarchy.
 * @param resource - The infrastructure resource type
 * @param hierarchy - The user's hierarchy level (admin, tenant, client)
 * @returns Permission object for the resource
 */
export function getPermissionsForHierarchy<T extends ResourceType>(
  resource: T,
  hierarchy: Hierarchy
): PermissionMap[T] {
  return PERMISSION_PRESETS[resource][hierarchy];
}

// ============================================
// Convenience exports
// ============================================

export function getElasticIpPermissions(hierarchy: Hierarchy): ElasticIpPermissions {
  return getPermissionsForHierarchy("elasticIps", hierarchy);
}

export function getSecurityGroupPermissions(hierarchy: Hierarchy): SecurityGroupPermissions {
  return getPermissionsForHierarchy("securityGroups", hierarchy);
}

export function getSubnetPermissions(hierarchy: Hierarchy): SubnetPermissions {
  return getPermissionsForHierarchy("subnets", hierarchy);
}

export function getVpcPermissions(hierarchy: Hierarchy): VpcPermissions {
  return getPermissionsForHierarchy("vpcs", hierarchy);
}

export function getNetworkInterfacePermissions(hierarchy: Hierarchy): NetworkInterfacePermissions {
  return getPermissionsForHierarchy("networkInterfaces", hierarchy);
}

export function getKeyPairPermissions(hierarchy: Hierarchy): KeyPairPermissions {
  return getPermissionsForHierarchy("keyPairs", hierarchy);
}

export function getNatGatewayPermissions(hierarchy: Hierarchy): NatGatewayPermissions {
  return getPermissionsForHierarchy("natGateways", hierarchy);
}

export function getRouteTablePermissions(hierarchy: Hierarchy): RouteTablePermissions {
  return getPermissionsForHierarchy("routeTables", hierarchy);
}

export function getInternetGatewayPermissions(hierarchy: Hierarchy): InternetGatewayPermissions {
  return getPermissionsForHierarchy("internetGateways", hierarchy);
}

export function getNetworkAclPermissions(hierarchy: Hierarchy): NetworkAclPermissions {
  return getPermissionsForHierarchy("networkAcls", hierarchy);
}
