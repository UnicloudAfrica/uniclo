import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext } from "@/hooks/useApiContext";
import ToastUtils from "@/utils/toastUtil";
import type { SecurityGroup } from "@/shared/components/infrastructure/types";
import {
  type ResourceLike,
  asArray,
  asRecord,
  buildUrl,
  getErrorMessage,
  normalizeSecurityGroup,
  resolveLocalId,
  resolveRegion,
} from "./vpcInfraUtils";

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

  return useMutation<
    unknown,
    Error,
    {
      projectId: string;
      region?: string;
      payload: { vpc_id: string; name: string; description?: string };
    }
  >({
    mutationFn: async ({ projectId, region, payload }) => {
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

  return useMutation<void, Error, { projectId: string; region?: string; securityGroupId: string }>({
    mutationFn: async ({ projectId, region, securityGroupId }) => {
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
      const localId = resolveLocalId(cached as ResourceLike[] | undefined, securityGroupId);

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

export const useUpdateSecurityGroup = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation<
    unknown,
    Error,
    {
      projectId: string;
      region?: string;
      securityGroupId: string;
      payload: { name?: string; description?: string };
    }
  >({
    mutationFn: async ({ projectId, region, securityGroupId, payload }) => {
      if (context === "admin") {
        const { data } = await axios.patch(
          buildUrl(
            apiBaseUrl,
            context,
            `/projects/${projectId}/security-groups/${securityGroupId}`
          ),
          payload,
          { headers: authHeaders, withCredentials: true }
        );
        return data;
      }

      const resolvedRegion = resolveRegion(region, context);
      const cached = queryClient.getQueryData<SecurityGroup[]>([
        "security-groups",
        context,
        projectId,
        resolvedRegion,
      ]);
      const localId = resolveLocalId(cached as ResourceLike[] | undefined, securityGroupId);

      const { data } = await axios.patch(
        buildUrl(apiBaseUrl, context, `/security-groups/${localId}`),
        { project_id: projectId, region: resolvedRegion, ...payload },
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_: void, { projectId, region }: { projectId: string; region?: string }) => {
      const resolvedRegion = region || "";
      ToastUtils.success("Security group updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["security-groups", context, projectId, resolvedRegion],
      });
    },
    onError: (error: unknown) => {
      ToastUtils.error(getErrorMessage(error, "Failed to update security group"));
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

  return useMutation<
    unknown,
    Error,
    {
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
    }
  >({
    mutationFn: async ({ projectId, region, securityGroupId, payload }) => {
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

  return useMutation<
    void,
    Error,
    {
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
    }
  >({
    mutationFn: async ({ projectId, region, securityGroupId, payload }) => {
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
