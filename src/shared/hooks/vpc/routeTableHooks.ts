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
  resolveRegion,
} from "./vpcInfraUtils";

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

  return useMutation<
    any,
    Error,
    {
      projectId: string;
      region?: string;
      payload: {
        route_table_id: string;
        destination_cidr_block: string;
        gateway_id?: string;
        nat_gateway_id?: string;
      };
    }
  >({
    mutationFn: async ({ projectId, region, payload }) => {
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

  return useMutation<
    void,
    Error,
    {
      projectId: string;
      region?: string;
      payload: { route_table_id: string; destination_cidr_block: string };
    }
  >({
    mutationFn: async ({ projectId, region, payload }) => {
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

  return useMutation<
    any,
    Error,
    { projectId: string; region?: string; routeTableId: string; subnetId: string }
  >({
    mutationFn: async ({ projectId, region, routeTableId, subnetId }) => {
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

  return useMutation<void, Error, { projectId: string; region?: string; associationId: string }>({
    mutationFn: async ({ projectId, region, associationId }) => {
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
