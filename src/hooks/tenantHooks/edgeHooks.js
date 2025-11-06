import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";

const normalizeCollection = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.edge_networks)) return payload.edge_networks;
  if (Array.isArray(payload.edge_network_ip_pools)) return payload.edge_network_ip_pools;
  if (Array.isArray(payload.pools)) return payload.pools;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data) {
    return normalizeCollection(payload.data);
  }
  return [];
};

const fetchTenantEdgeNetworks = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  const response = await silentTenantApi(
    "GET",
    `/admin/edge-networks${params.toString() ? `?${params}` : ""}`
  );
  return normalizeCollection(response?.data ?? response);
};

const fetchTenantIpPools = async ({ project_id, region, edge_network_id }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (edge_network_id) params.append("edge_network_id", edge_network_id);
  const response = await silentTenantApi(
    "GET",
    `/admin/edge-ip-pools${params.toString() ? `?${params}` : ""}`
  );
  return normalizeCollection(response?.data ?? response);
};

const assignTenantProjectEdge = async ({ payload }) => {
  const response = await tenantApi(
    "POST",
    "/admin/edge-config/assign",
    payload
  );
  return response?.data ?? response;
};

export const useFetchTenantEdgeNetworks = (projectId, region, options = {}) =>
  useQuery({
    queryKey: ["tenant-edge-networks", { projectId, region }],
    queryFn: () =>
      fetchTenantEdgeNetworks({ project_id: projectId, region }),
    enabled: !!region,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useFetchTenantIpPools = (
  projectId,
  region,
  edgeNetworkId,
  options = {}
) =>
  useQuery({
    queryKey: ["tenant-edge-ip-pools", { projectId, region, edgeNetworkId }],
    queryFn: () =>
      fetchTenantIpPools({
        project_id: projectId,
        region,
        edge_network_id: edgeNetworkId,
      }),
    enabled: !!region && !!edgeNetworkId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useAssignTenantProjectEdge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignTenantProjectEdge,
    onSuccess: (data, variables) => {
      const projectId = variables?.payload?.project_id;
      const region = variables?.payload?.region;
      if (projectId && region) {
        queryClient.invalidateQueries({
          queryKey: ["project-edge-config", { projectId, region }],
        });
        queryClient.invalidateQueries({
          queryKey: ["tenant-edge-networks", { projectId, region }],
        });
        queryClient.invalidateQueries({
          queryKey: ["tenant-edge-ip-pools", { projectId, region }],
        });
      } else if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["project-edge-config"] });
        queryClient.invalidateQueries({ queryKey: ["tenant-edge-networks"] });
        queryClient.invalidateQueries({ queryKey: ["tenant-edge-ip-pools"] });
      }
    },
  });
};
