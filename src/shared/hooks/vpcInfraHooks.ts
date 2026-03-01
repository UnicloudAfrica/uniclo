import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext, ApiContext } from "../../hooks/useApiContext";
import ToastUtils from "../../utils/toastUtil";
import type {
  ElasticIp,
  NatGateway,
  NetworkAcl,
  SecurityGroup,
  Subnet,
  VpcPeeringConnection,
} from "../components/infrastructure/types";

type UnknownRecord = Record<string, unknown>;
type ResourceLike = {
  id?: unknown;
  provider_resource_id?: unknown;
  allocation_id?: unknown;
  local_id?: unknown;
  [key: string]: unknown;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const asRecord = (value: unknown): UnknownRecord => (isRecord(value) ? value : {});

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const asOptionalString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  return String(value);
};

const asOptionalNumber = (value: unknown): number | undefined => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const getErrorMessage = (error: unknown, fallback: string) => {
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

const getInfraPrefix = (context: ApiContext) => {
  if (context === "tenant") return "/admin";
  if (context === "client") return "/business";
  return "";
};

const buildUrl = (apiBaseUrl: string, context: ApiContext, path: string) => {
  return `${apiBaseUrl}${getInfraPrefix(context)}${path}`;
};

const resolveRegion = (region: string | undefined, context: ApiContext) => {
  if (context === "admin") return region || "";
  if (!region) {
    throw new Error("Region is required for this request");
  }
  return region;
};

const normalizeResourceId = <T extends ResourceLike>(item: T): T => {
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

const resolveLocalId = (items: Array<ResourceLike> | undefined, providerId: string) => {
  if (!items || !providerId) return providerId;
  const match = items.find(
    (item) =>
      String(item.id ?? "") === providerId || String(item.provider_resource_id ?? "") === providerId
  );
  const localId = match?.local_id ?? match?.id;
  return localId ? String(localId) : providerId;
};

const normalizeElasticIp = (item: unknown): ElasticIp => {
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

const normalizeNatGateway = (item: unknown): NatGateway => {
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

const normalizeNetworkAcl = (item: unknown): NetworkAcl => {
  const record = asRecord(item);
  return normalizeResourceId(record as ResourceLike) as NetworkAcl;
};

const normalizeSecurityGroup = (item: unknown): SecurityGroup => {
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

const normalizeSubnet = (item: unknown): Subnet => {
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

const normalizeVpcPeering = (item: unknown): VpcPeeringConnection => {
  const record = asRecord(item);
  return normalizeResourceId(record as ResourceLike) as VpcPeeringConnection;
};

// ==================== NAT Gateways ====================

export const useNatGateways = (
  projectId: string,
  region?: string,
  options?: { enabled?: boolean }
) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = region || "";
  const isAdmin = context === "admin";

  return useQuery({
    queryKey: ["nat-gateways", context, projectId, resolvedRegion],
    queryFn: async () => {
      const url = isAdmin
        ? buildUrl(apiBaseUrl, context, `/projects/${projectId}/nat-gateways`)
        : buildUrl(apiBaseUrl, context, `/nat-gateways`);

      const { data } = await axios.get(url, {
        params: isAdmin ? undefined : { project_id: projectId, region: resolvedRegion },
        headers: authHeaders,
        withCredentials: true,
      });

      const items = asArray(asRecord(data)["data"]);
      return items.map(normalizeNatGateway);
    },
    enabled:
      isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion) && options?.enabled !== false,
  });
};

export const useCreateNatGateway = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      payload,
    }: {
      projectId: string;
      region?: string;
      payload: { subnet_id: string; elastic_ip_id?: string; name?: string; vpc_id?: string };
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/nat-gateways`),
          payload,
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolvedRegion = resolveRegion(region, context);
      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, `/nat-gateways`),
        { project_id: projectId, region: resolvedRegion, ...payload },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("NAT Gateway created successfully");
      queryClient.invalidateQueries({
        queryKey: ["nat-gateways", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to create NAT Gateway"));
    },
  });
};

export const useDeleteNatGateway = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      natGatewayId,
    }: {
      projectId: string;
      region?: string;
      natGatewayId: string;
    }) => {
      if (context === "admin") {
        await axios.delete(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/nat-gateways/${natGatewayId}`),
          { headers: authHeaders, withCredentials: true }
        );
        return;
      }

      const resolvedRegion = resolveRegion(region, context);
      const cached = queryClient.getQueryData<NatGateway[]>([
        "nat-gateways",
        context,
        projectId,
        resolvedRegion,
      ]);
      const localId = resolveLocalId(cached, natGatewayId);

      await axios.delete(buildUrl(apiBaseUrl, context, `/nat-gateways/${localId}`), {
        headers: authHeaders,
        withCredentials: true,
        data: { project_id: projectId, region: resolvedRegion },
      });
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("NAT Gateway deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["nat-gateways", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to delete NAT Gateway"));
    },
  });
};

// ==================== Elastic IPs ====================

export const useElasticIps = (
  projectId: string,
  region?: string,
  options?: { enabled?: boolean }
) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = region || "";
  const isAdmin = context === "admin";

  return useQuery({
    queryKey: ["elastic-ips", context, projectId, resolvedRegion],
    queryFn: async () => {
      const url = isAdmin
        ? buildUrl(apiBaseUrl, context, `/projects/${projectId}/elastic-ips`)
        : buildUrl(apiBaseUrl, context, `/elastic-ips`);

      const { data } = await axios.get(url, {
        params: isAdmin ? undefined : { project_id: projectId, region: resolvedRegion },
        headers: authHeaders,
        withCredentials: true,
      });

      const items = asArray(asRecord(data)["data"]);
      return items.map(normalizeElasticIp);
    },
    enabled:
      isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion) && options?.enabled !== false,
  });
};

export const useCreateElasticIp = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      payload,
    }: {
      projectId: string;
      region?: string;
      payload?: { name?: string };
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/elastic-ips`),
          payload || {},
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolvedRegion = resolveRegion(region, context);
      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, `/elastic-ips`),
        { project_id: projectId, region: resolvedRegion, ...(payload || {}) },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Elastic IP allocated successfully");
      queryClient.invalidateQueries({
        queryKey: ["elastic-ips", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to allocate Elastic IP"));
    },
  });
};

export const useAssociateElasticIp = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      elasticIpId,
      payload,
    }: {
      projectId: string;
      region?: string;
      elasticIpId: string;
      payload: { instance_id?: string; network_interface_id?: string };
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(
            apiBaseUrl,
            context,
            `/projects/${projectId}/elastic-ips/${elasticIpId}/associate`
          ),
          payload,
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolvedRegion = resolveRegion(region, context);
      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, `/elastic-ip-associations`),
        {
          project_id: projectId,
          region: resolvedRegion,
          allocation_id: elasticIpId,
          instance_id: payload.instance_id,
          eni_id: payload.network_interface_id,
        },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Elastic IP associated successfully");
      queryClient.invalidateQueries({
        queryKey: ["elastic-ips", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to associate Elastic IP"));
    },
  });
};

export const useDisassociateElasticIp = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      elasticIpId,
    }: {
      projectId: string;
      region?: string;
      elasticIpId: string;
    }) => {
      if (context === "admin") {
        await axios.delete(
          buildUrl(
            apiBaseUrl,
            context,
            `/projects/${projectId}/elastic-ips/${elasticIpId}/disassociate`
          ),
          { headers: authHeaders, withCredentials: true }
        );
        return;
      }

      const resolvedRegion = resolveRegion(region, context);
      await axios.delete(buildUrl(apiBaseUrl, context, `/elastic-ip-associations`), {
        headers: authHeaders,
        withCredentials: true,
        data: { project_id: projectId, region: resolvedRegion, allocation_id: elasticIpId },
      });
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Elastic IP disassociated successfully");
      queryClient.invalidateQueries({
        queryKey: ["elastic-ips", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to disassociate Elastic IP"));
    },
  });
};

export const useDeleteElasticIp = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      elasticIpId,
    }: {
      projectId: string;
      region?: string;
      elasticIpId: string;
    }) => {
      if (context === "admin") {
        await axios.delete(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/elastic-ips/${elasticIpId}`),
          { headers: authHeaders, withCredentials: true }
        );
        return;
      }

      const resolvedRegion = resolveRegion(region, context);
      const cached = queryClient.getQueryData<ElasticIp[]>([
        "elastic-ips",
        context,
        projectId,
        resolvedRegion,
      ]);
      const localId = resolveLocalId(cached, elasticIpId);

      await axios.delete(buildUrl(apiBaseUrl, context, `/elastic-ips/${localId}`), {
        headers: authHeaders,
        withCredentials: true,
        data: { project_id: projectId, region: resolvedRegion },
      });
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Elastic IP released successfully");
      queryClient.invalidateQueries({
        queryKey: ["elastic-ips", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to release Elastic IP"));
    },
  });
};

// ==================== Security Groups ====================

export const useSecurityGroups = (
  projectId: string,
  region?: string,
  options?: { enabled?: boolean }
) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = region || "";
  const isAdmin = context === "admin";

  return useQuery({
    queryKey: ["security-groups", context, projectId, resolvedRegion],
    queryFn: async () => {
      const url = isAdmin
        ? buildUrl(apiBaseUrl, context, `/projects/${projectId}/security-groups`)
        : buildUrl(apiBaseUrl, context, `/security-groups`);

      const { data } = await axios.get(url, {
        params: isAdmin ? undefined : { project_id: projectId, region: resolvedRegion },
        headers: authHeaders,
        withCredentials: true,
      });

      const items = asArray(asRecord(data)["data"]);
      return items.map(normalizeSecurityGroup);
    },
    enabled:
      isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion) && options?.enabled !== false,
  });
};

export const useCreateSecurityGroup = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      payload,
    }: {
      projectId: string;
      region?: string;
      payload: { vpc_id: string; name: string; description?: string };
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/security-groups`),
          payload,
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolvedRegion = resolveRegion(region, context);
      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, `/security-groups`),
        { project_id: projectId, region: resolvedRegion, ...payload },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Security group created successfully");
      queryClient.invalidateQueries({
        queryKey: ["security-groups", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to create security group"));
    },
  });
};

export const useDeleteSecurityGroup = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      securityGroupId,
    }: {
      projectId: string;
      region?: string;
      securityGroupId: string;
    }) => {
      if (context === "admin") {
        await axios.delete(
          buildUrl(
            apiBaseUrl,
            context,
            `/projects/${projectId}/security-groups/${securityGroupId}`
          ),
          { headers: authHeaders, withCredentials: true }
        );
        return;
      }

      const resolvedRegion = resolveRegion(region, context);
      const cached = queryClient.getQueryData<SecurityGroup[]>([
        "security-groups",
        context,
        projectId,
        resolvedRegion,
      ]);
      const localId = resolveLocalId(cached, securityGroupId);

      await axios.delete(buildUrl(apiBaseUrl, context, `/security-groups/${localId}`), {
        headers: authHeaders,
        withCredentials: true,
        data: { project_id: projectId, region: resolvedRegion },
      });
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Security group deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["security-groups", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to delete security group"));
    },
  });
};

// ==================== Security Group Rules ====================

export const useSecurityGroupRules = (
  projectId: string,
  securityGroupId: string,
  region?: string
) => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = region || "";
  const isAdmin = context === "admin";

  return useQuery({
    queryKey: ["security-group-rules", context, projectId, securityGroupId, resolvedRegion],
    queryFn: async () => {
      if (isAdmin) {
        const { data } = await axios.get(
          buildUrl(
            apiBaseUrl,
            context,
            `/projects/${projectId}/security-groups/${securityGroupId}/rules`
          ),
          { headers: authHeaders, withCredentials: true }
        );
        return data.data || { ingress_rules: [], egress_rules: [] };
      }

      const resolved = resolveRegion(region, context);
      const cachedGroups = queryClient.getQueryData<SecurityGroup[]>([
        "security-groups",
        context,
        projectId,
        resolved,
      ]);

      const resolveRules = (group: unknown) => {
        const record = asRecord(group);
        const rules = asRecord(record["rules"]);
        return {
          ingress: asArray(rules["ingress"] ?? rules["ingress_rules"] ?? record["ingress_rules"]),
          egress: asArray(rules["egress"] ?? rules["egress_rules"] ?? record["egress_rules"]),
        };
      };

      if (!cachedGroups) {
        const { data } = await axios.get(buildUrl(apiBaseUrl, context, `/security-groups`), {
          params: { project_id: projectId, region: resolved },
          headers: authHeaders,
          withCredentials: true,
        });

        const items = asArray(asRecord(data)["data"]);
        const normalized = items.map(normalizeSecurityGroup);
        queryClient.setQueryData(["security-groups", context, projectId, resolved], normalized);
        const match = normalized.find((sg) => sg.id === securityGroupId);
        const { ingress, egress } = resolveRules(match);
        return { ingress_rules: ingress, egress_rules: egress };
      }

      const match = cachedGroups.find((sg: { id: string }) => sg.id === securityGroupId);
      const { ingress, egress } = resolveRules(match);
      return { ingress_rules: ingress, egress_rules: egress };
    },
    enabled: isAuthenticated && !!projectId && !!securityGroupId && (isAdmin || !!resolvedRegion),
  });
};

const buildSecurityGroupRule = (payload: {
  protocol: string;
  port_range_min?: number;
  port_range_max?: number;
  cidr?: string;
}) => {
  const rule: {
    ip_protocol: string;
    from_port: number;
    to_port: number;
    ip_ranges?: Array<{ cidr_ip: string }>;
  } = {
    ip_protocol: payload.protocol,
    from_port: payload.port_range_min ?? -1,
    to_port: payload.port_range_max ?? -1,
  };

  if (payload.cidr) {
    rule.ip_ranges = [{ cidr_ip: payload.cidr }];
  }

  return rule;
};

export const useAddSecurityGroupRule = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      securityGroupId,
      payload,
    }: {
      projectId: string;
      region?: string;
      securityGroupId: string;
      payload: {
        direction: "ingress" | "egress";
        protocol: string;
        port_range_min?: number;
        port_range_max?: number;
        cidr?: string;
      };
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(
            apiBaseUrl,
            context,
            `/projects/${projectId}/security-groups/${securityGroupId}/rules`
          ),
          payload,
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolved = resolveRegion(region, context);
      const rule = buildSecurityGroupRule(payload);
      const endpoint =
        payload.direction === "ingress"
          ? "/security-group-ingress-rules"
          : "/security-group-egress-rules";

      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, endpoint),
        {
          project_id: projectId,
          region: resolved,
          security_group_id: securityGroupId,
          ip_permissions: [rule],
        },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (
      _: void,
      {
        projectId,
        region,
        securityGroupId,
      }: { projectId: string; region?: string; securityGroupId: string }
    ) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Security group rule added successfully");
      queryClient.invalidateQueries({
        queryKey: ["security-group-rules", context, projectId, securityGroupId, resolvedRegion],
      });
      queryClient.invalidateQueries({
        queryKey: ["security-groups", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to add security group rule"));
    },
  });
};

export const useRemoveSecurityGroupRule = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      securityGroupId,
      payload,
    }: {
      projectId: string;
      region?: string;
      securityGroupId: string;
      payload: {
        direction: "ingress" | "egress";
        protocol: string;
        port_range_min?: number;
        port_range_max?: number;
        cidr?: string;
      };
    }) => {
      if (context === "admin") {
        await axios.delete(
          buildUrl(
            apiBaseUrl,
            context,
            `/projects/${projectId}/security-groups/${securityGroupId}/rules`
          ),
          { headers: authHeaders, withCredentials: true, data: payload }
        );
        return;
      }

      const resolved = resolveRegion(region, context);
      const rule = buildSecurityGroupRule(payload);
      const endpoint =
        payload.direction === "ingress"
          ? "/security-group-ingress-rules"
          : "/security-group-egress-rules";

      await axios.delete(buildUrl(apiBaseUrl, context, `${endpoint}/${securityGroupId}`), {
        headers: authHeaders,
        withCredentials: true,
        data: {
          project_id: projectId,
          region: resolved,
          security_group_id: securityGroupId,
          ip_permissions: [rule],
        },
      });
    },
    onSuccess: (
      _: void,
      {
        projectId,
        region,
        securityGroupId,
      }: { projectId: string; region?: string; securityGroupId: string }
    ) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Security group rule removed successfully");
      queryClient.invalidateQueries({
        queryKey: ["security-group-rules", context, projectId, securityGroupId, resolvedRegion],
      });
      queryClient.invalidateQueries({
        queryKey: ["security-groups", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to remove security group rule"));
    },
  });
};

// ==================== Subnets ====================

export const useSubnets = (projectId: string, region?: string, options?: { enabled?: boolean }) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = region || "";
  const isAdmin = context === "admin";

  return useQuery({
    queryKey: ["subnets", context, projectId, resolvedRegion],
    queryFn: async () => {
      const url = isAdmin
        ? buildUrl(apiBaseUrl, context, `/projects/${projectId}/subnets`)
        : buildUrl(apiBaseUrl, context, `/subnets`);

      const { data } = await axios.get(url, {
        params: isAdmin ? undefined : { project_id: projectId, region: resolvedRegion },
        headers: authHeaders,
        withCredentials: true,
      });

      const items = asArray(asRecord(data)["data"]);
      return items.map(normalizeSubnet);
    },
    enabled:
      isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion) && options?.enabled !== false,
  });
};

export const useCreateSubnet = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      payload,
    }: {
      projectId: string;
      region?: string;
      payload: { name: string; cidr_block: string; vpc_id: string };
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/subnets`),
          payload,
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolvedRegion = resolveRegion(region, context);
      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, `/subnets`),
        { project_id: projectId, region: resolvedRegion, ...payload },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Subnet created successfully");
      queryClient.invalidateQueries({
        queryKey: ["subnets", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to create subnet"));
    },
  });
};

export const useDeleteSubnet = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      subnetId,
    }: {
      projectId: string;
      region?: string;
      subnetId: string;
    }) => {
      if (context === "admin") {
        await axios.delete(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/subnets/${subnetId}`),
          {
            headers: authHeaders,
            withCredentials: true,
          }
        );
        return;
      }

      const resolvedRegion = resolveRegion(region, context);
      const cached = queryClient.getQueryData<Subnet[]>([
        "subnets",
        context,
        projectId,
        resolvedRegion,
      ]);
      const localId = resolveLocalId(cached, subnetId);

      await axios.delete(buildUrl(apiBaseUrl, context, `/subnets/${localId}`), {
        headers: authHeaders,
        withCredentials: true,
        data: { project_id: projectId, region: resolvedRegion },
      });
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Subnet deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["subnets", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to delete subnet"));
    },
  });
};

// ==================== VPCs ====================

export const useVpcs = (projectId: string, region?: string, options?: { enabled?: boolean }) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = region || "";
  const isAdmin = context === "admin";

  return useQuery({
    queryKey: ["vpcs", context, projectId, resolvedRegion],
    queryFn: async () => {
      const url = isAdmin
        ? buildUrl(apiBaseUrl, context, `/projects/${projectId}/vpcs`)
        : buildUrl(apiBaseUrl, context, `/vpcs`);

      const { data } = await axios.get(url, {
        params: isAdmin ? undefined : { project_id: projectId, region: resolvedRegion },
        headers: authHeaders,
        withCredentials: true,
      });

      const items = asArray(asRecord(data)["data"]);
      return items.map((item) => normalizeResourceId(asRecord(item) as ResourceLike));
    },
    enabled:
      isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion) && options?.enabled !== false,
  });
};

export const useCreateVpc = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      payload,
    }: {
      projectId: string;
      region?: string;
      payload: { name: string; cidr: string; is_default?: boolean };
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/vpcs`),
          payload,
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolvedRegion = resolveRegion(region, context);
      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, `/vpcs`),
        { project_id: projectId, region: resolvedRegion, ...payload },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("VPC created successfully");
      queryClient.invalidateQueries({
        queryKey: ["vpcs", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to create VPC"));
    },
  });
};

export const useDeleteVpc = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      vpcId,
    }: {
      projectId: string;
      region?: string;
      vpcId: string;
    }) => {
      if (context === "admin") {
        await axios.delete(buildUrl(apiBaseUrl, context, `/projects/${projectId}/vpcs/${vpcId}`), {
          headers: authHeaders,
          withCredentials: true,
        });
        return;
      }

      const resolvedRegion = resolveRegion(region, context);
      const cached = queryClient.getQueryData<Array<ResourceLike>>([
        "vpcs",
        context,
        projectId,
        resolvedRegion,
      ]);
      const localId = resolveLocalId(cached, vpcId);

      await axios.delete(buildUrl(apiBaseUrl, context, `/vpcs/${localId}`), {
        headers: authHeaders,
        withCredentials: true,
        data: { project_id: projectId, region: resolvedRegion },
      });
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("VPC deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["vpcs", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to delete VPC"));
    },
  });
};

// ==================== Network ACLs ====================

export const useNetworkAcls = (
  projectId: string,
  region?: string,
  options?: { enabled?: boolean }
) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = region || "";
  const isAdmin = context === "admin";

  return useQuery({
    queryKey: ["network-acls", context, projectId, resolvedRegion],
    queryFn: async () => {
      const url = isAdmin
        ? buildUrl(apiBaseUrl, context, `/projects/${projectId}/network-acls`)
        : buildUrl(apiBaseUrl, context, `/network-acls`);

      const { data } = await axios.get(url, {
        params: isAdmin ? undefined : { project_id: projectId, region: resolvedRegion },
        headers: authHeaders,
        withCredentials: true,
      });

      const items = asArray(asRecord(data)["data"]);
      return items.map(normalizeNetworkAcl);
    },
    enabled:
      isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion) && options?.enabled !== false,
  });
};

export const useCreateNetworkAcl = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      payload,
    }: {
      projectId: string;
      region?: string;
      payload: { vpc_id: string; name?: string };
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/network-acls`),
          payload,
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolvedRegion = resolveRegion(region, context);
      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, `/network-acls`),
        { project_id: projectId, region: resolvedRegion, ...payload },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Network ACL created successfully");
      queryClient.invalidateQueries({
        queryKey: ["network-acls", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to create Network ACL"));
    },
  });
};

export const useDeleteNetworkAcl = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      networkAclId,
    }: {
      projectId: string;
      region?: string;
      networkAclId: string;
    }) => {
      if (context === "admin") {
        await axios.delete(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/network-acls/${networkAclId}`),
          { headers: authHeaders, withCredentials: true }
        );
        return;
      }

      const resolvedRegion = resolveRegion(region, context);
      const cached = queryClient.getQueryData<NetworkAcl[]>([
        "network-acls",
        context,
        projectId,
        resolvedRegion,
      ]);
      const localId = resolveLocalId(cached, networkAclId);

      await axios.delete(buildUrl(apiBaseUrl, context, `/network-acls/${localId}`), {
        headers: authHeaders,
        withCredentials: true,
        data: { project_id: projectId, region: resolvedRegion },
      });
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Network ACL deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["network-acls", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to delete Network ACL"));
    },
  });
};

export const useNetworkAclRules = (projectId: string, networkAclId: string, region?: string) => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = region || "";
  const isAdmin = context === "admin";

  return useQuery({
    queryKey: ["network-acl-rules", context, projectId, networkAclId, resolvedRegion],
    queryFn: async () => {
      if (isAdmin) {
        const { data } = await axios.get(
          buildUrl(
            apiBaseUrl,
            context,
            `/projects/${projectId}/network-acls/${networkAclId}/rules`
          ),
          { headers: authHeaders, withCredentials: true }
        );
        return data.data || { entries: [] };
      }

      const resolved = resolveRegion(region, context);
      const { data } = await axios.get(buildUrl(apiBaseUrl, context, `/network-acls`), {
        params: { project_id: projectId, region: resolved },
        headers: authHeaders,
        withCredentials: true,
      });

      const items = asArray(asRecord(data)["data"]);
      const normalized = items.map(normalizeNetworkAcl);
      queryClient.setQueryData(["network-acls", context, projectId, resolved], normalized);
      const match = normalized.find((acl) => acl.id === networkAclId);
      return match || { entries: [] };
    },
    enabled: isAuthenticated && !!projectId && !!networkAclId && (isAdmin || !!resolvedRegion),
  });
};

export const useAddNetworkAclRule = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      networkAclId,
      payload,
    }: {
      projectId: string;
      region?: string;
      networkAclId: string;
      payload: {
        rule_number: number;
        protocol: string;
        rule_action: "allow" | "deny";
        egress: boolean;
        cidr_block: string;
        port_range_min?: number;
        port_range_max?: number;
      };
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(
            apiBaseUrl,
            context,
            `/projects/${projectId}/network-acls/${networkAclId}/rules`
          ),
          payload,
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolved = resolveRegion(region, context);
      const entry: {
        rule_number: number;
        protocol: string;
        rule_action: "allow" | "deny";
        egress: boolean;
        cidr_block: string;
        port_range?: { from: number; to: number };
      } = {
        rule_number: payload.rule_number,
        protocol: payload.protocol,
        rule_action: payload.rule_action,
        egress: payload.egress,
        cidr_block: payload.cidr_block,
      };

      if (payload.port_range_min !== undefined && payload.port_range_max !== undefined) {
        entry.port_range = { from: payload.port_range_min, to: payload.port_range_max };
      }

      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, `/network-acls/${networkAclId}/entries`),
        {
          project_id: projectId,
          region: resolved,
          network_acl_id: networkAclId,
          entries: [entry],
        },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (
      _: void,
      {
        projectId,
        region,
        networkAclId,
      }: { projectId: string; region?: string; networkAclId: string }
    ) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Network ACL rule added successfully");
      queryClient.invalidateQueries({
        queryKey: ["network-acl-rules", context, projectId, networkAclId, resolvedRegion],
      });
      queryClient.invalidateQueries({
        queryKey: ["network-acls", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to add Network ACL rule"));
    },
  });
};

export const useRemoveNetworkAclRule = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      networkAclId,
      payload,
    }: {
      projectId: string;
      region?: string;
      networkAclId: string;
      payload: { rule_number: number; egress: boolean };
    }) => {
      if (context === "admin") {
        await axios.delete(
          buildUrl(
            apiBaseUrl,
            context,
            `/projects/${projectId}/network-acls/${networkAclId}/rules`
          ),
          { headers: authHeaders, withCredentials: true, data: payload }
        );
        return;
      }

      const resolved = resolveRegion(region, context);
      const cacheKey = ["network-acl-rules", context, projectId, networkAclId, resolved];
      const cached = queryClient.getQueryData(cacheKey);
      const entries = asArray(asRecord(cached)["entries"]);
      const entry = entries.find((rule) => {
        const record = asRecord(rule);
        return record["rule_number"] === payload.rule_number && record["egress"] === payload.egress;
      });
      const entryRecord = asRecord(entry);
      const entryId = entryRecord["id"] ?? entryRecord["entry_id"];
      if (!entryId) {
        throw new Error("Rule entry id not found for deletion");
      }

      await axios.delete(buildUrl(apiBaseUrl, context, `/network-acls/${networkAclId}/entries`), {
        headers: authHeaders,
        withCredentials: true,
        data: {
          project_id: projectId,
          region: resolved,
          network_acl_id: networkAclId,
          entry_ids: [entryId],
        },
      });
    },
    onSuccess: (
      _: void,
      {
        projectId,
        region,
        networkAclId,
      }: { projectId: string; region?: string; networkAclId: string }
    ) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Network ACL rule removed successfully");
      queryClient.invalidateQueries({
        queryKey: ["network-acl-rules", context, projectId, networkAclId, resolvedRegion],
      });
      queryClient.invalidateQueries({
        queryKey: ["network-acls", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to remove Network ACL rule"));
    },
  });
};

// ==================== VPC Peering ====================

export const useVpcPeering = (
  projectId: string,
  region?: string,
  options?: { enabled?: boolean }
) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = region || "";
  const isAdmin = context === "admin";

  return useQuery({
    queryKey: ["vpc-peering", context, projectId, resolvedRegion],
    queryFn: async () => {
      const url = isAdmin
        ? buildUrl(apiBaseUrl, context, `/projects/${projectId}/vpc-peering`)
        : buildUrl(apiBaseUrl, context, `/vpc-peering-connections`);

      const { data } = await axios.get(url, {
        params: isAdmin ? undefined : { project_id: projectId, region: resolvedRegion },
        headers: authHeaders,
        withCredentials: true,
      });

      const items = asArray(asRecord(data)["data"]);
      return items.map(normalizeVpcPeering);
    },
    enabled:
      isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion) && options?.enabled !== false,
  });
};

export const useCreateVpcPeering = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      payload,
    }: {
      projectId: string;
      region?: string;
      payload: { vpc_id: string; peer_vpc_id: string; name?: string };
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/vpc-peering`),
          payload,
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolved = resolveRegion(region, context);
      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, `/vpc-peering-connections`),
        {
          project_id: projectId,
          region: resolved,
          requester_vpc_id: payload.vpc_id,
          accepter_vpc_id: payload.peer_vpc_id,
          name: payload.name,
        },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("VPC peering connection created successfully");
      queryClient.invalidateQueries({
        queryKey: ["vpc-peering", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to create VPC peering connection"));
    },
  });
};

export const useAcceptVpcPeering = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      peeringId,
    }: {
      projectId: string;
      region?: string;
      peeringId: string;
    }) => {
      if (context === "admin") {
        await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/vpc-peering/${peeringId}/accept`),
          {},
          { headers: authHeaders, withCredentials: true }
        );
        return;
      }

      const resolved = resolveRegion(region, context);
      await axios.post(
        buildUrl(apiBaseUrl, context, `/vpc-peering-connections/${peeringId}/accept`),
        {
          project_id: projectId,
          region: resolved,
          vpc_peering_connection_id: peeringId,
        },
        { headers: authHeaders, withCredentials: true }
      );
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("VPC peering connection accepted");
      queryClient.invalidateQueries({
        queryKey: ["vpc-peering", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to accept VPC peering connection"));
    },
  });
};

export const useRejectVpcPeering = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      peeringId,
    }: {
      projectId: string;
      region?: string;
      peeringId: string;
    }) => {
      if (context === "admin") {
        await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/vpc-peering/${peeringId}/reject`),
          {},
          { headers: authHeaders, withCredentials: true }
        );
        return;
      }

      const resolved = resolveRegion(region, context);
      await axios.post(
        buildUrl(apiBaseUrl, context, `/vpc-peering-connections/${peeringId}/reject`),
        {
          project_id: projectId,
          region: resolved,
          vpc_peering_connection_id: peeringId,
        },
        { headers: authHeaders, withCredentials: true }
      );
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("VPC peering connection rejected");
      queryClient.invalidateQueries({
        queryKey: ["vpc-peering", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to reject VPC peering connection"));
    },
  });
};

export const useDeleteVpcPeering = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      peeringId,
    }: {
      projectId: string;
      region?: string;
      peeringId: string;
    }) => {
      if (context === "admin") {
        await axios.delete(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/vpc-peering/${peeringId}`),
          { headers: authHeaders, withCredentials: true }
        );
        return;
      }

      const resolved = resolveRegion(region, context);
      const cached = queryClient.getQueryData<VpcPeeringConnection[]>([
        "vpc-peering",
        context,
        projectId,
        resolved,
      ]);
      const localId = resolveLocalId(cached, peeringId);

      await axios.delete(buildUrl(apiBaseUrl, context, `/vpc-peering-connections/${localId}`), {
        headers: authHeaders,
        withCredentials: true,
        data: { project_id: projectId, region: resolved },
      });
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("VPC peering connection deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["vpc-peering", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to delete VPC peering connection"));
    },
  });
};

// ==================== Internet Gateways ====================

export const useInternetGateways = (
  projectId: string,
  region?: string,
  options?: { enabled?: boolean }
) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = region || "";
  const isAdmin = context === "admin";

  return useQuery({
    queryKey: ["internet-gateways", context, projectId, resolvedRegion],
    queryFn: async () => {
      const url = isAdmin
        ? buildUrl(apiBaseUrl, context, `/projects/${projectId}/internet-gateways`)
        : buildUrl(apiBaseUrl, context, `/internet-gateways`);

      const { data } = await axios.get(url, {
        params: isAdmin ? undefined : { project_id: projectId, region: resolvedRegion },
        headers: authHeaders,
        withCredentials: true,
      });

      const items = asArray<ResourceLike>(asRecord(data)["data"]);
      return items.map(normalizeResourceId);
    },
    enabled:
      isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion) && options?.enabled !== false,
  });
};

export const useCreateInternetGateway = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      payload,
    }: {
      projectId: string;
      region?: string;
      payload?: { name?: string };
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/internet-gateways`),
          payload || {},
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolvedRegion = resolveRegion(region, context);
      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, `/internet-gateways`),
        { project_id: projectId, region: resolvedRegion, ...(payload || {}) },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Internet Gateway created successfully");
      queryClient.invalidateQueries({
        queryKey: ["internet-gateways", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to create Internet Gateway"));
    },
  });
};

export const useDeleteInternetGateway = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      igwId,
    }: {
      projectId: string;
      region?: string;
      igwId: string;
    }) => {
      if (context === "admin") {
        await axios.delete(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/internet-gateways/${igwId}`),
          { headers: authHeaders, withCredentials: true }
        );
        return;
      }

      const resolvedRegion = resolveRegion(region, context);
      const cached = queryClient.getQueryData<Array<ResourceLike>>([
        "internet-gateways",
        context,
        projectId,
        resolvedRegion,
      ]);
      const localId = resolveLocalId(cached, igwId);

      await axios.delete(buildUrl(apiBaseUrl, context, `/internet-gateways/${localId}`), {
        headers: authHeaders,
        withCredentials: true,
        data: { project_id: projectId, region: resolvedRegion },
      });
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Internet Gateway deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["internet-gateways", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to delete Internet Gateway"));
    },
  });
};

export const useAttachInternetGateway = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      igwId,
      vpcId,
    }: {
      projectId: string;
      region?: string;
      igwId: string;
      vpcId: string;
    }) => {
      if (context === "admin") {
        await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/internet-gateways/${igwId}/attach`),
          { vpc_id: vpcId },
          { headers: authHeaders, withCredentials: true }
        );
        return;
      }

      const resolvedRegion = resolveRegion(region, context);
      await axios.post(
        buildUrl(apiBaseUrl, context, `/internet-gateway-attachments`),
        {
          project_id: projectId,
          region: resolvedRegion,
          internet_gateway_id: igwId,
          vpc_id: vpcId,
        },
        { headers: authHeaders, withCredentials: true }
      );
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Internet Gateway attached successfully");
      queryClient.invalidateQueries({
        queryKey: ["internet-gateways", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to attach Internet Gateway"));
    },
  });
};

export const useDetachInternetGateway = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      igwId,
      vpcId,
    }: {
      projectId: string;
      region?: string;
      igwId: string;
      vpcId: string;
    }) => {
      if (context === "admin") {
        await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/internet-gateways/${igwId}/detach`),
          { vpc_id: vpcId },
          { headers: authHeaders, withCredentials: true }
        );
        return;
      }

      const resolvedRegion = resolveRegion(region, context);
      await axios.delete(buildUrl(apiBaseUrl, context, `/internet-gateway-attachments`), {
        headers: authHeaders,
        withCredentials: true,
        data: {
          project_id: projectId,
          region: resolvedRegion,
          internet_gateway_id: igwId,
          vpc_id: vpcId,
        },
      });
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Internet Gateway detached successfully");
      queryClient.invalidateQueries({
        queryKey: ["internet-gateways", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to detach Internet Gateway"));
    },
  });
};

// ==================== Route Tables ====================

export const useRouteTables = (
  projectId: string,
  region?: string,
  options?: { enabled?: boolean }
) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = region || "";
  const isAdmin = context === "admin";

  return useQuery({
    queryKey: ["route-tables", context, projectId, resolvedRegion],
    queryFn: async () => {
      const url = isAdmin
        ? buildUrl(apiBaseUrl, context, `/projects/${projectId}/route-tables`)
        : buildUrl(apiBaseUrl, context, `/route-tables`);

      const { data } = await axios.get(url, {
        params: isAdmin ? undefined : { project_id: projectId, region: resolvedRegion },
        headers: authHeaders,
        withCredentials: true,
      });

      const items = asArray<ResourceLike>(asRecord(data)["data"]);
      return items.map(normalizeResourceId);
    },
    enabled:
      isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion) && options?.enabled !== false,
  });
};

export const useCreateRoute = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      payload,
    }: {
      projectId: string;
      region?: string;
      payload: {
        route_table_id: string;
        destination_cidr_block: string;
        gateway_id?: string;
        nat_gateway_id?: string;
      };
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(apiBaseUrl, context, `/projects/${projectId}/routes`),
          payload,
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolved = resolveRegion(region, context);
      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, `/routes`),
        { project_id: projectId, region: resolved, ...payload },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Route created successfully");
      queryClient.invalidateQueries({
        queryKey: ["route-tables", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to create route"));
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      payload,
    }: {
      projectId: string;
      region?: string;
      payload: { route_table_id: string; destination_cidr_block: string };
    }) => {
      if (context === "admin") {
        await axios.delete(buildUrl(apiBaseUrl, context, `/projects/${projectId}/routes`), {
          headers: authHeaders,
          withCredentials: true,
          data: payload,
        });
        return;
      }

      const resolved = resolveRegion(region, context);
      await axios.delete(buildUrl(apiBaseUrl, context, `/routes`), {
        headers: authHeaders,
        withCredentials: true,
        data: { project_id: projectId, region: resolved, ...payload },
      });
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Route deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["route-tables", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to delete route"));
    },
  });
};

export const useAssociateRouteTable = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      routeTableId,
      subnetId,
    }: {
      projectId: string;
      region?: string;
      routeTableId: string;
      subnetId: string;
    }) => {
      if (context === "admin") {
        const { data } = await axios.post(
          buildUrl(
            apiBaseUrl,
            context,
            `/projects/${projectId}/route-tables/${routeTableId}/associate`
          ),
          { subnet_id: subnetId },
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolved = resolveRegion(region, context);
      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, `/route-table-associations`),
        {
          project_id: projectId,
          region: resolved,
          route_table_id: routeTableId,
          subnet_id: subnetId,
        },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Route table associated successfully");
      queryClient.invalidateQueries({
        queryKey: ["route-tables", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to associate route table"));
    },
  });
};

export const useDisassociateRouteTable = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({
      projectId,
      region,
      associationId,
    }: {
      projectId: string;
      region?: string;
      associationId: string;
    }) => {
      if (context === "admin") {
        await axios.delete(
          buildUrl(
            apiBaseUrl,
            context,
            `/projects/${projectId}/route-table-associations/${associationId}`
          ),
          { headers: authHeaders, withCredentials: true }
        );
        return;
      }

      const resolved = resolveRegion(region, context);
      await axios.delete(
        buildUrl(apiBaseUrl, context, `/route-table-associations/${associationId}`),
        {
          headers: authHeaders,
          withCredentials: true,
          data: { project_id: projectId, region: resolved },
        }
      );
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Route table disassociated successfully");
      queryClient.invalidateQueries({
        queryKey: ["route-tables", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to disassociate route table"));
    },
  });
};
