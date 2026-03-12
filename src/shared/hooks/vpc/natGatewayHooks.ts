import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext } from "@/hooks/useApiContext";
import ToastUtils from "@/utils/toastUtil";
import type { NatGateway } from "@/shared/components/infrastructure/types";
import {
  type ResourceLike,
  asArray,
  asRecord,
  buildUrl,
  getErrorMessage,
  normalizeNatGateway,
  resolveLocalId,
  resolveRegion,
} from "./vpcInfraUtils";

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

  return useMutation<
    any,
    Error,
    {
      projectId: string;
      region?: string;
      payload: { subnet_id: string; elastic_ip_id?: string; name?: string; vpc_id?: string };
    }
  >({
    mutationFn: async ({ projectId, region, payload }) => {
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

  return useMutation<void, Error, { projectId: string; region?: string; natGatewayId: string }>({
    mutationFn: async ({ projectId, region, natGatewayId }) => {
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
      const localId = resolveLocalId(cached as ResourceLike[] | undefined, natGatewayId);

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
