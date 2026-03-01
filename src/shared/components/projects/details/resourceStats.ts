type NumericInput = number | string | null | undefined;

const toNumber = (value: NumericInput): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const pickNumber = (...values: NumericInput[]): number | undefined => {
  for (const value of values) {
    const parsed = toNumber(value);
    if (typeof parsed === "number") return parsed;
  }
  return undefined;
};

export interface IpPool {
  id?: string;
  uuid?: string;
  edge_network_ip_pool_id?: string;
  ip_pool_id?: string;
  pool_id?: string;
  total?: number;
  total_ips?: number;
  total_ip_count?: number;
  ip_total?: number;
  ip_count?: number;
  capacity?: number;
  size?: number;
  addresses_total?: number;
  used?: number;
  used_ips?: number;
  used_ip_count?: number;
  allocated?: number;
  allocated_ips?: number;
  in_use?: number;
  assigned?: number;
  consumed?: number;
  available?: number;
  free?: number;
  free_ips?: number;
  available_ips?: number;
}

const normalizePoolList = (input: unknown): IpPool[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input as IpPool[];

  const obj = input as Record<string, unknown>;
  if (Array.isArray(obj.items)) return obj.items as IpPool[];
  if (Array.isArray(obj.edge_network_ip_pools)) return obj.edge_network_ip_pools as IpPool[];
  if (Array.isArray(obj.pools)) return obj.pools as IpPool[];
  if (Array.isArray(obj.data)) return obj.data as IpPool[];
  return [];
};

const extractPoolFromMetadata = (
  metadata: { edge_network_ip_pools?: IpPool[] | Record<string, IpPool[]> } | null | undefined
): IpPool[] => {
  if (!metadata) return [];
  const pools = metadata.edge_network_ip_pools;
  if (Array.isArray(pools)) return pools;
  if (pools && typeof pools === "object") {
    return Object.values(pools).flatMap((value) => (Array.isArray(value) ? value : []));
  }
  return [];
};

const extractPoolCounts = (
  pool: IpPool | null | undefined
): { used: number; total: number } | null => {
  if (!pool) return null;
  const total =
    pickNumber(
      pool.total,
      pool.total_ips,
      pool.total_ip_count,
      pool.ip_total,
      pool.ip_count,
      pool.capacity,
      pool.size,
      pool.addresses_total
    ) ?? null;
  const used =
    pickNumber(
      pool.used,
      pool.used_ips,
      pool.used_ip_count,
      pool.allocated,
      pool.allocated_ips,
      pool.in_use,
      pool.assigned,
      pool.consumed
    ) ?? null;
  const available =
    pickNumber(pool.available, pool.free, pool.free_ips, pool.available_ips) ?? null;

  if (typeof total === "number") {
    if (typeof used === "number") {
      return { used, total };
    }
    if (typeof available === "number") {
      return { used: Math.max(0, total - available), total };
    }
  }

  if (typeof used === "number" && typeof available === "number") {
    return { used, total: used + available };
  }

  return null;
};

const matchPoolById = (pool: IpPool | null | undefined, poolId: string): boolean => {
  if (!poolId || !pool) return false;
  const candidate =
    pool.edge_network_ip_pool_id || pool.ip_pool_id || pool.pool_id || pool.id || pool.uuid;
  return candidate === poolId;
};

export const deriveIpPoolStats = ({
  edgeConfig,
  ipPools,
  networkStatus,
}: {
  edgeConfig?: any;
  ipPools?: unknown[];
  networkStatus?: { ip_pool?: IpPool; public_ip_pool?: IpPool };
}) => {
  const payload = edgeConfig?.data ?? edgeConfig;
  const poolId: string =
    payload?.ip_pool_id || payload?.edge_ip_pool_id || payload?.edge_network_ip_pool_id || "";

  const directTotals = extractPoolCounts(payload);
  if (directTotals) return directTotals;

  const statusTotals =
    extractPoolCounts(networkStatus?.ip_pool) ||
    extractPoolCounts(networkStatus?.public_ip_pool) ||
    null;
  if (statusTotals) return statusTotals;

  const candidates = [...normalizePoolList(ipPools), ...extractPoolFromMetadata(payload?.metadata)];

  if (poolId) {
    const match = candidates.find((pool) => matchPoolById(pool, poolId));
    const matchTotals = extractPoolCounts(match);
    if (matchTotals) return matchTotals;
  }

  for (const pool of candidates) {
    const counts = extractPoolCounts(pool);
    if (counts) return counts;
  }

  return { used: 0, total: 0 };
};

interface InstanceCompute {
  memory_mb?: number;
  ram_mb?: number;
  memory_gb?: number;
  ram_gb?: number;
}

interface InstanceFlavor {
  memory_mb?: number;
  ram?: number;
}

interface InstanceResource {
  compute?: InstanceCompute;
  memory_mb?: number;
  ram_mb?: number;
  memory_gb?: number;
  ram_gb?: number;
  memoryGb?: number;
  flavor?: InstanceFlavor;
}

const getMemoryMb = (instance: InstanceResource): number => {
  const memoryMb =
    pickNumber(
      instance?.compute?.memory_mb,
      instance?.memory_mb,
      instance?.ram_mb,
      instance?.flavor?.memory_mb,
      instance?.flavor?.ram
    ) ?? null;
  if (typeof memoryMb === "number") return memoryMb;

  const memoryGb =
    pickNumber(
      instance?.compute?.memory_gb,
      instance?.memory_gb,
      instance?.ram_gb,
      instance?.memoryGb
    ) ?? null;
  if (typeof memoryGb === "number") return memoryGb * 1024;

  return 0;
};

export const getProjectRamLabel = (instances: InstanceResource[] | null | undefined): string => {
  const list = Array.isArray(instances) ? instances : [];
  const totalMb = list.reduce((sum, instance) => sum + getMemoryMb(instance), 0);
  if (totalMb > 0) {
    const totalGb = Math.round(totalMb / 1024);
    return `${totalGb} GiB`;
  }
  if (list.length === 0) return "0 GiB";
  return "—";
};
