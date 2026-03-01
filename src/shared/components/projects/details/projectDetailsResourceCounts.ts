import type { ResourceCounts } from "./ProjectUnifiedView";

interface InfraComponent {
  count?: number | null;
}

export interface InfraStatusData {
  data?: {
    counts?: Record<string, number | null | undefined>;
    components?: Record<string, InfraComponent | undefined>;
    completion_percentage?: number;
  };
}

const pickCount = (...values: Array<number | null | undefined>): number => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
};

export const buildProjectResourceCounts = ({
  infraStatusData,
  fallback,
  usersCount,
}: {
  infraStatusData?: InfraStatusData | null;
  fallback?: Partial<ResourceCounts> & Record<string, number | null | undefined>;
  usersCount?: number;
}): ResourceCounts => {
  const counts = infraStatusData?.data?.counts || {};
  const components = infraStatusData?.data?.components || {};
  const fallbackCounts = fallback || {};

  return {
    vpcs: pickCount(counts["vpcs"], components?.["vpc"]?.count, fallbackCounts["vpcs"]),
    subnets: pickCount(
      counts["subnets"],
      components?.["subnets"]?.count,
      fallbackCounts["subnets"]
    ),
    security_groups: pickCount(
      counts["security_groups"],
      components?.["security_groups"]?.count,
      fallbackCounts["security_groups"]
    ),
    key_pairs: pickCount(
      counts["keypairs"],
      counts["key_pairs"],
      components?.["keypairs"]?.count,
      fallbackCounts["key_pairs"]
    ),
    route_tables: pickCount(
      counts["route_tables"],
      components?.["route_tables"]?.count,
      fallbackCounts["route_tables"]
    ),
    elastic_ips: pickCount(
      counts["elastic_ips"],
      components?.["elastic_ips"]?.count,
      fallbackCounts["elastic_ips"]
    ),
    network_interfaces: pickCount(
      counts["network_interfaces"],
      components?.["network_interfaces"]?.count,
      fallbackCounts["network_interfaces"]
    ),
    internet_gateways: pickCount(
      counts["internet_gateways"],
      components?.["internet_gateways"]?.count,
      fallbackCounts["internet_gateways"]
    ),
    nat_gateways: pickCount(counts["nat_gateways"], fallbackCounts["nat_gateways"]),
    network_acls: pickCount(counts["network_acls"], fallbackCounts["network_acls"]),
    vpc_peering: pickCount(counts["vpc_peering"], fallbackCounts["vpc_peering"]),
    load_balancers: pickCount(counts["load_balancers"], fallbackCounts["load_balancers"]),
    volumes: pickCount(counts["volumes"], fallbackCounts["volumes"]),
    images: pickCount(counts["images"], fallbackCounts["images"]),
    snapshots: pickCount(counts["snapshots"], fallbackCounts["snapshots"]),
    users: pickCount(usersCount, fallbackCounts["users"]),
  };
};
