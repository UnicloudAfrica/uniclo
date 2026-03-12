import type { ApiContext } from "@/hooks/useApiContext";
import type {
  ElasticIp,
  NatGateway,
  NetworkAcl,
  SecurityGroup,
  Subnet,
  Vpc,
  VpcPeeringConnection,
} from "@/shared/components/infrastructure/types";

export type UnknownRecord = Record<string, unknown>;
export type ResourceLike = {
  id?: unknown;
  provider_resource_id?: unknown;
  allocation_id?: unknown;
  local_id?: unknown;
  [key: string]: unknown;
};

export const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

export const asRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {});

export const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export const asOptionalString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  return String(value);
};

export const asOptionalNumber = (value: unknown): number | undefined => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  const record = asRecord(error);
  const response = asRecord(record["response"]);
  const responseData = asRecord(response["data"]);
  return (
    (responseData["error"] as string | undefined) ||
    (responseData["message"] as string | undefined) ||
    (record["message"] as string | undefined) ||
    fallback
  );
};

export const getInfraPrefix = (context: ApiContext) => {
  if (context === "tenant") return "/admin";
  if (context === "client") return "/business";
  return "";
};

export const buildUrl = (apiBaseUrl: string, context: ApiContext, path: string) => {
  return `${apiBaseUrl}${getInfraPrefix(context)}${path}`;
};

export const resolveRegion = (region: string | undefined, context: ApiContext) => {
  if (context === "admin") return region || "";
  if (!region) {
    throw new Error("Region is required for this request");
  }
  return region;
};

export const normalizeResourceId = <T extends ResourceLike>(item: T): T => {
  const providerId = item.provider_resource_id ?? item.allocation_id ?? item.id;
  const localId = item.local_id ?? item.id;

  return {
    ...item,
    provider_resource_id: item.provider_resource_id ?? providerId,
    allocation_id: item.allocation_id ?? providerId,
    local_id: localId,
    id: providerId ?? item.id,
  };
};

export const resolveLocalId = (items: Array<ResourceLike> | undefined, providerId: string) => {
  if (!items || !providerId) return providerId;
  const match = items.find(
    (item) =>
      String(item.id ?? "") === providerId || String(item.provider_resource_id ?? "") === providerId
  );
  const localId = match?.local_id ?? match?.id;
  return localId ? String(localId) : providerId;
};

export const normalizeElasticIp = (item: unknown): ElasticIp => {
  const record = asRecord(item);
  const normalized = normalizeResourceId(record as ResourceLike);
  return {
    ...normalized,
    public_ip: asOptionalString(record["public_ip"] ?? record["publicIp"]),
    instance_id: asOptionalString(
      record["instance_id"] ?? record["associated_instance_id"] ?? record["associatedInstanceId"]
    ),
    network_interface_id: asOptionalString(
      record["network_interface_id"] ??
        record["associated_network_interface_id"] ??
        record["associatedNetworkInterfaceId"]
    ),
    association_id: asOptionalString(record["association_id"] ?? record["associationId"]),
    state: asOptionalString(record["state"] ?? record["status"]),
  } as ElasticIp;
};

export const normalizeNatGateway = (item: unknown): NatGateway => {
  const record = asRecord(item);
  const normalized = normalizeResourceId(record as ResourceLike);
  return {
    ...normalized,
    public_ip: asOptionalString(
      record["public_ip"] ?? record["elastic_ip"] ?? record["elastic_ip_address"]
    ),
    state: asOptionalString(record["state"] ?? record["status"]),
  } as NatGateway;
};

export const normalizeNetworkAcl = (item: unknown): NetworkAcl => {
  const record = asRecord(item);
  return normalizeResourceId(record as ResourceLike) as NetworkAcl;
};

export const normalizeSecurityGroup = (item: unknown): SecurityGroup => {
  const record = asRecord(item);
  const normalized = normalizeResourceId(record as ResourceLike);
  const rules = asRecord(record["rules"]);
  const ingressRules = asArray(
    rules["ingress"] ?? rules["ingress_rules"] ?? record["ingress_rules"]
  );
  const egressRules = asArray(rules["egress"] ?? rules["egress_rules"] ?? record["egress_rules"]);

  return {
    ...normalized,
    description: asOptionalString(record["description"] ?? record["desc"]),
    inbound_rules_count: asOptionalNumber(record["inbound_rules_count"]) ?? ingressRules.length,
    outbound_rules_count: asOptionalNumber(record["outbound_rules_count"]) ?? egressRules.length,
  } as SecurityGroup;
};

export const normalizeSubnet = (item: unknown): Subnet => {
  const record = asRecord(item);
  const normalized = normalizeResourceId(record as ResourceLike);
  return {
    ...normalized,
    cidr: asOptionalString(record["cidr"] ?? record["cidr_block"]),
    cidr_block: asOptionalString(record["cidr_block"] ?? record["cidr"]),
    state: asOptionalString(record["state"] ?? record["status"]),
    available_ips: asOptionalNumber(
      record["available_ips"] ??
        record["available_ip_address_count"] ??
        record["availableIpAddressCount"]
    ),
    is_default:
      (record["is_default"] as boolean | undefined) ?? (record["default"] as boolean | undefined),
  } as Subnet;
};

export const normalizeVpc = (item: unknown): Vpc => {
  const record = asRecord(item);
  const normalized = normalizeResourceId(record as ResourceLike);
  return {
    ...normalized,
    cidr: asOptionalString(record["cidr"] ?? record["cidr_block"]),
    cidr_block: asOptionalString(record["cidr_block"] ?? record["cidr"]),
    state: asOptionalString(record["state"] ?? record["status"]),
  } as Vpc;
};

export const normalizeVpcPeering = (item: unknown): VpcPeeringConnection => {
  const record = asRecord(item);
  return normalizeResourceId(record as ResourceLike) as VpcPeeringConnection;
};
