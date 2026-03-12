import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext } from "@/hooks/useApiContext";
import ToastUtils from "@/utils/toastUtil";
import type { Subnet } from "@/shared/components/infrastructure/types";
import {
  type ResourceLike,
  asArray,
  asRecord,
  buildUrl,
  getErrorMessage,
  normalizeSubnet,
  resolveLocalId,
  resolveRegion,
} from "./vpcInfraUtils";

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

  return useMutation<
    any,
    Error,
    {
      projectId: string;
      region?: string;
      payload: { name: string; cidr_block: string; vpc_id: string };
    }
  >({
    mutationFn: async ({ projectId, region, payload }) => {
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

  return useMutation<void, Error, { projectId: string; region?: string; subnetId: string }>({
    mutationFn: async ({ projectId, region, subnetId }) => {
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
      const localId = resolveLocalId(cached as ResourceLike[] | undefined, subnetId);

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
