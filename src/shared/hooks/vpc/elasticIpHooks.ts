import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext } from "@/hooks/useApiContext";
import ToastUtils from "@/utils/toastUtil";
import type { ElasticIp } from "@/shared/components/infrastructure/types";
import {
  type ResourceLike,
  asArray,
  asRecord,
  buildUrl,
  getErrorMessage,
  normalizeElasticIp,
  resolveLocalId,
  resolveRegion,
} from "./vpcInfraUtils";

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

  return useMutation<
    any,
    Error,
    {
      projectId: string;
      region?: string;
      elasticIpId: string;
      payload: { instance_id?: string; network_interface_id?: string };
    }
  >({
    mutationFn: async ({ projectId, region, elasticIpId, payload }) => {
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

  return useMutation<void, Error, { projectId: string; region?: string; elasticIpId: string }>({
    mutationFn: async ({ projectId, region, elasticIpId }) => {
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

  return useMutation<void, Error, { projectId: string; region?: string; elasticIpId: string }>({
    mutationFn: async ({ projectId, region, elasticIpId }) => {
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
      const localId = resolveLocalId(cached as ResourceLike[] | undefined, elasticIpId);

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
