/**
 * Provider feature support matrix.
 * Used to gate UI features based on the cloud provider.
 */
export const PROVIDER_FEATURES: Record<string, Record<string, boolean>> = {
  zadara: {
    nat_gateways: true,
    network_acls: true,
    vpc_peering: true,
    vpc_endpoints: true,
    flow_logs: true,
    discovery: true,
    dns: true,
    load_balancers: true,
    autoscaling: true,
    firewall_groups: false,
    trunks: false,
    qos: false,
    consistency_groups: false,
    vpcs: true,
    subnets: true,
    route_tables: true,
    security_groups: true,
    internet_gateways: true,
    elastic_ips: true,
    network_interfaces: true,
    block_storage: true,
    floating_ips: false,
    managed_databases: true,
  },
  nobus: {
    nat_gateways: false,
    network_acls: false,
    vpc_peering: false,
    vpc_endpoints: false,
    flow_logs: false,
    discovery: false,
    dns: false,
    load_balancers: false,
    autoscaling: false,
    firewall_groups: true,
    trunks: true,
    qos: true,
    object_storage: true,
    consistency_groups: true,
    vpcs: false,
    subnets: false,
    route_tables: false,
    internet_gateways: false,
    elastic_ips: true,
    network_interfaces: true,
    snapshots: true,
    block_storage: true,
    floating_ips: true,
    security_groups: true,
    managed_databases: true,
  },
};

/**
 * Check if a feature is supported by the given provider.
 * Returns true by default for unknown providers/features (fail-open for forward compatibility).
 */
export function isFeatureSupported(provider: string | undefined | null, feature: string): boolean {
  if (!provider) return true;
  return PROVIDER_FEATURES[provider.toLowerCase()]?.[feature] ?? true;
}
