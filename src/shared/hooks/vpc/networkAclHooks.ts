import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext } from "@/hooks/useApiContext";
import ToastUtils from "@/utils/toastUtil";
import type { NetworkAcl } from "@/shared/components/infrastructure/types";
import {
  type ResourceLike,
  asArray,
  asRecord,
  buildUrl,
  getErrorMessage,
  normalizeNetworkAcl,
  resolveLocalId,
  resolveRegion,
} from "./vpcInfraUtils";

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

  return useMutation<
    unknown,
    Error,
    { projectId: string; region?: string; payload: { vpc_id: string; name?: string } }
  >({
    mutationFn: async ({ projectId, region, payload }) => {
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

  return useMutation<void, Error, { projectId: string; region?: string; networkAclId: string }>({
    mutationFn: async ({ projectId, region, networkAclId }) => {
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
      const localId = resolveLocalId(cached as ResourceLike[] | undefined, networkAclId);

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

  return useMutation<
    unknown,
    Error,
    {
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
    }
  >({
    mutationFn: async ({ projectId, region, networkAclId, payload }) => {
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

  return useMutation<
    void,
    Error,
    {
      projectId: string;
      region?: string;
      networkAclId: string;
      payload: { rule_number: number; egress: boolean };
    }
  >({
    mutationFn: async ({ projectId, region, networkAclId, payload }) => {
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
