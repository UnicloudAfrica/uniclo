import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext } from "@/hooks/useApiContext";
import ToastUtils from "@/utils/toastUtil";
import type { VpcPeeringConnection } from "@/shared/components/infrastructure/types";
import {
  type ResourceLike,
  asArray,
  asRecord,
  buildUrl,
  getErrorMessage,
  normalizeVpcPeering,
  resolveLocalId,
  resolveRegion,
} from "./vpcInfraUtils";

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

  return useMutation<
    unknown,
    Error,
    {
      projectId: string;
      region?: string;
      payload: { vpc_id: string; peer_vpc_id: string; name?: string };
    }
  >({
    mutationFn: async ({ projectId, region, payload }) => {
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

  return useMutation<void, Error, { projectId: string; region?: string; peeringId: string }>({
    mutationFn: async ({ projectId, region, peeringId }) => {
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

  return useMutation<void, Error, { projectId: string; region?: string; peeringId: string }>({
    mutationFn: async ({ projectId, region, peeringId }) => {
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

  return useMutation<void, Error, { projectId: string; region?: string; peeringId: string }>({
    mutationFn: async ({ projectId, region, peeringId }) => {
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
      const localId = resolveLocalId(cached as ResourceLike[] | undefined, peeringId);

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
