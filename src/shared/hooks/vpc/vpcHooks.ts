import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext } from "@/hooks/useApiContext";
import ToastUtils from "@/utils/toastUtil";
import {
  type ResourceLike,
  asArray,
  asRecord,
  buildUrl,
  getErrorMessage,
  normalizeVpc,
  resolveLocalId,
  resolveRegion,
} from "./vpcInfraUtils";

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
      return items.map((item) => normalizeVpc(item));
    },
    enabled:
      isAuthenticated && !!projectId && (isAdmin || !!resolvedRegion) && options?.enabled !== false,
  });
};

export const useCreateVpc = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation<
    unknown,
    Error,
    {
      projectId: string;
      region?: string;
      payload: { name: string; cidr: string; is_default?: boolean };
    }
  >({
    mutationFn: async ({ projectId, region, payload }) => {
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

  return useMutation<void, Error, { projectId: string; region?: string; vpcId: string }>({
    mutationFn: async ({ projectId, region, vpcId }) => {
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
