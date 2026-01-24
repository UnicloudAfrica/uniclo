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

const normalizeResourceId = <T extends Record<string, any>>(item: T) => {
  const providerId = item.provider_resource_id || item.allocation_id || item.id;
  const localId = item.local_id ?? item.id;

  return {
    ...item,
    provider_resource_id: item.provider_resource_id ?? providerId,
    allocation_id: item.allocation_id ?? providerId,
    local_id: localId,
    id: providerId,
  };
};

const resolveLocalId = (items: Array<any> | undefined, providerId: string) => {
  if (!items || !providerId) return providerId;
  const match = items.find(
    (item) => item.id === providerId || item.provider_resource_id === providerId
  );
  return match?.local_id ?? match?.id ?? providerId;
};

const normalizeElasticIp = (item: any): ElasticIp => {
  const normalized = normalizeResourceId(item);
  return {
    ...normalized,
    public_ip: item.public_ip ?? item.publicIp,
    instance_id: item.instance_id ?? item.associated_instance_id ?? item.associatedInstanceId,
    network_interface_id:
      item.network_interface_id ??
      item.associated_network_interface_id ??
      item.associatedNetworkInterfaceId,
    association_id: item.association_id ?? item.associationId,
    state: item.state ?? item.status,
  };
};

const normalizeNatGateway = (item: any): NatGateway => {
  const normalized = normalizeResourceId(item);
  return {
    ...normalized,
    public_ip: item.public_ip ?? item.elastic_ip ?? item.elastic_ip_address,
    state: item.state ?? item.status,
  };
};

const normalizeNetworkAcl = (item: any): NetworkAcl => {
  return normalizeResourceId(item);
};

const normalizeSecurityGroup = (item: any): SecurityGroup => {
  const normalized = normalizeResourceId(item);
  const ingressRules = item.rules?.ingress ?? item.rules?.ingress_rules ?? item.ingress_rules ?? [];
  const egressRules = item.rules?.egress ?? item.rules?.egress_rules ?? item.egress_rules ?? [];

  return {
    ...normalized,
    description: item.description ?? item.desc,
    inbound_rules_count: item.inbound_rules_count ?? ingressRules.length,
    outbound_rules_count: item.outbound_rules_count ?? egressRules.length,
  };
};

const normalizeSubnet = (item: any): Subnet => {
  const normalized = normalizeResourceId(item);
  return {
    ...normalized,
    cidr: item.cidr ?? item.cidr_block,
    cidr_block: item.cidr_block ?? item.cidr,
    state: item.state ?? item.status,
    available_ips:
      item.available_ips ?? item.available_ip_address_count ?? item.availableIpAddressCount,
    is_default: item.is_default ?? item.default,
  };
};

const normalizeVpcPeering = (item: any): VpcPeeringConnection => {
  return normalizeResourceId(item);
};

// ==================== NAT Gateways ====================

export const useNatGateways = (projectId: string, region?: string) => {
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

      const items = data.data || [];
      return (items as any[]).map(normalizeNatGateway);
    },
    enabled: isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion),
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("NAT Gateway created successfully");
      queryClient.invalidateQueries({
        queryKey: ["nat-gateways", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create NAT Gateway");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("NAT Gateway deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["nat-gateways", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete NAT Gateway");
    },
  });
};

// ==================== Elastic IPs ====================

export const useElasticIps = (projectId: string, region?: string) => {
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

      const items = data.data || [];
      return (items as any[]).map(normalizeElasticIp);
    },
    enabled: isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion),
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Elastic IP allocated successfully");
      queryClient.invalidateQueries({
        queryKey: ["elastic-ips", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to allocate Elastic IP");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Elastic IP associated successfully");
      queryClient.invalidateQueries({
        queryKey: ["elastic-ips", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to associate Elastic IP");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Elastic IP disassociated successfully");
      queryClient.invalidateQueries({
        queryKey: ["elastic-ips", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to disassociate Elastic IP");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Elastic IP released successfully");
      queryClient.invalidateQueries({
        queryKey: ["elastic-ips", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to release Elastic IP");
    },
  });
};

// ==================== Security Groups ====================

export const useSecurityGroups = (projectId: string, region?: string) => {
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

      const items = data.data || [];
      return (items as any[]).map(normalizeSecurityGroup);
    },
    enabled: isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion),
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Security group created successfully");
      queryClient.invalidateQueries({
        queryKey: ["security-groups", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create security group");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Security group deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["security-groups", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete security group");
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

      if (!cachedGroups) {
        const { data } = await axios.get(buildUrl(apiBaseUrl, context, `/security-groups`), {
          params: { project_id: projectId, region: resolved },
          headers: authHeaders,
          withCredentials: true,
        });

        const items = (data.data || []) as any[];
        const normalized = items.map(normalizeSecurityGroup);
        queryClient.setQueryData(["security-groups", context, projectId, resolved], normalized);
        const match = normalized.find((sg) => sg.id === securityGroupId);
        const ingress = (match as any)?.rules?.ingress ?? [];
        const egress = (match as any)?.rules?.egress ?? [];
        return { ingress_rules: ingress, egress_rules: egress };
      }

      const match = cachedGroups.find((sg) => sg.id === securityGroupId) as any;
      const ingress = match?.rules?.ingress ?? [];
      const egress = match?.rules?.egress ?? [];
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
  const rule: any = {
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
    onSuccess: (_, { projectId, region, securityGroupId }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Security group rule added successfully");
      queryClient.invalidateQueries({
        queryKey: ["security-group-rules", context, projectId, securityGroupId, resolvedRegion],
      });
      queryClient.invalidateQueries({
        queryKey: ["security-groups", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to add security group rule");
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
    onSuccess: (_, { projectId, region, securityGroupId }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Security group rule removed successfully");
      queryClient.invalidateQueries({
        queryKey: ["security-group-rules", context, projectId, securityGroupId, resolvedRegion],
      });
      queryClient.invalidateQueries({
        queryKey: ["security-groups", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to remove security group rule");
    },
  });
};

// ==================== Subnets ====================

export const useSubnets = (projectId: string, region?: string) => {
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

      const items = data.data || [];
      return (items as any[]).map(normalizeSubnet);
    },
    enabled: isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion),
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Subnet created successfully");
      queryClient.invalidateQueries({
        queryKey: ["subnets", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create subnet");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Subnet deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["subnets", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete subnet");
    },
  });
};

// ==================== VPCs ====================

export const useVpcs = (projectId: string, region?: string) => {
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

      const items = data.data || [];
      return (items as any[]).map(normalizeResourceId);
    },
    enabled: isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion),
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("VPC created successfully");
      queryClient.invalidateQueries({
        queryKey: ["vpcs", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create VPC");
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
      const cached = queryClient.getQueryData<any[]>(["vpcs", context, projectId, resolvedRegion]);
      const localId = resolveLocalId(cached, vpcId);

      await axios.delete(buildUrl(apiBaseUrl, context, `/vpcs/${localId}`), {
        headers: authHeaders,
        withCredentials: true,
        data: { project_id: projectId, region: resolvedRegion },
      });
    },
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("VPC deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["vpcs", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete VPC");
    },
  });
};

// ==================== Network ACLs ====================

export const useNetworkAcls = (projectId: string, region?: string) => {
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

      const items = data.data || [];
      return (items as any[]).map(normalizeNetworkAcl);
    },
    enabled: isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion),
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Network ACL created successfully");
      queryClient.invalidateQueries({
        queryKey: ["network-acls", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create Network ACL");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Network ACL deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["network-acls", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete Network ACL");
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

      const items = (data.data || []) as any[];
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
      const entry: any = {
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
    onSuccess: (_, { projectId, region, networkAclId }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Network ACL rule added successfully");
      queryClient.invalidateQueries({
        queryKey: ["network-acl-rules", context, projectId, networkAclId, resolvedRegion],
      });
      queryClient.invalidateQueries({
        queryKey: ["network-acls", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to add Network ACL rule");
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
      const cached: any = queryClient.getQueryData(cacheKey);
      const entries = cached?.entries || [];
      const entry = entries.find(
        (rule: any) => rule.rule_number === payload.rule_number && rule.egress === payload.egress
      );
      const entryId = entry?.id ?? entry?.entry_id;
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
    onSuccess: (_, { projectId, region, networkAclId }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Network ACL rule removed successfully");
      queryClient.invalidateQueries({
        queryKey: ["network-acl-rules", context, projectId, networkAclId, resolvedRegion],
      });
      queryClient.invalidateQueries({
        queryKey: ["network-acls", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to remove Network ACL rule");
    },
  });
};

// ==================== VPC Peering ====================

export const useVpcPeering = (projectId: string, region?: string) => {
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

      const items = data.data || [];
      return (items as any[]).map(normalizeVpcPeering);
    },
    enabled: isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion),
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("VPC peering connection created successfully");
      queryClient.invalidateQueries({
        queryKey: ["vpc-peering", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create VPC peering connection");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("VPC peering connection accepted");
      queryClient.invalidateQueries({
        queryKey: ["vpc-peering", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to accept VPC peering connection");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("VPC peering connection rejected");
      queryClient.invalidateQueries({
        queryKey: ["vpc-peering", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to reject VPC peering connection");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("VPC peering connection deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["vpc-peering", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete VPC peering connection");
    },
  });
};

// ==================== Internet Gateways ====================

export const useInternetGateways = (projectId: string, region?: string) => {
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

      const items = data.data || [];
      return (items as any[]).map(normalizeResourceId);
    },
    enabled: isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion),
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Internet Gateway created successfully");
      queryClient.invalidateQueries({
        queryKey: ["internet-gateways", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create Internet Gateway");
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
      const cached = queryClient.getQueryData<any[]>([
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Internet Gateway deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["internet-gateways", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete Internet Gateway");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Internet Gateway attached successfully");
      queryClient.invalidateQueries({
        queryKey: ["internet-gateways", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to attach Internet Gateway");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Internet Gateway detached successfully");
      queryClient.invalidateQueries({
        queryKey: ["internet-gateways", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to detach Internet Gateway");
    },
  });
};

// ==================== Route Tables ====================

export const useRouteTables = (projectId: string, region?: string) => {
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

      const items = data.data || [];
      return (items as any[]).map(normalizeResourceId);
    },
    enabled: isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion),
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Route created successfully");
      queryClient.invalidateQueries({
        queryKey: ["route-tables", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create route");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Route deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["route-tables", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete route");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Route table associated successfully");
      queryClient.invalidateQueries({
        queryKey: ["route-tables", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to associate route table");
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
    onSuccess: (_, { projectId, region }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Route table disassociated successfully");
      queryClient.invalidateQueries({
        queryKey: ["route-tables", context, projectId, resolvedRegion],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to disassociate route table");
    },
  });
};
