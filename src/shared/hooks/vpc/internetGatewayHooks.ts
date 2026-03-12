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
  normalizeResourceId,
  resolveLocalId,
  resolveRegion,
} from "./vpcInfraUtils";

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

  return useMutation<void, Error, { projectId: string; region?: string; igwId: string }>({
    mutationFn: async ({ projectId, region, igwId }) => {
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

  return useMutation<
    void,
    Error,
    { projectId: string; region?: string; igwId: string; vpcId: string }
  >({
    mutationFn: async ({ projectId, region, igwId, vpcId }) => {
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

  return useMutation<
    void,
    Error,
    { projectId: string; region?: string; igwId: string; vpcId: string }
  >({
    mutationFn: async ({ projectId, region, igwId, vpcId }) => {
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
