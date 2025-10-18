import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";

// Admin: fetch project edge configuration
const fetchProjectEdgeConfigAdmin = async (projectId, region, refresh = false) => {
  if (!projectId) throw new Error("projectId is required");
  if (!region) throw new Error("region is required");
  try {
    const params = new URLSearchParams();
    params.append("project_id", projectId);
    params.append("region", region);
    if (refresh) params.append("refresh", "1");
    const res = await adminSilentApiforUser(
      "GET",
      `/business/edge-config?${params.toString()}`
    );
    return res?.data ?? res;
  } catch (e) {
    return null;
  }
};

// Admin: list available edge networks (optionally scoped by project)
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

const fetchEdgeNetworks = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  const res = await adminSilentApiforUser(
    "GET",
    `/business/edge-networks${params.toString() ? `?${params}` : ""}`
  );
  return normalizeCollection(res);
};

// Admin: list available IP pools (optionally scoped by project)
const fetchIpPools = async ({ project_id, region, edge_network_id }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (edge_network_id) params.append("edge_network_id", edge_network_id);
  const res = await adminSilentApiforUser(
    "GET",
    `/business/edge-ip-pools${params.toString() ? `?${params}` : ""}`
  );
  return normalizeCollection(res);
};

// Admin: assign or update edge config for a project
const assignProjectEdge = async ({ payload }) => {
  const res = await apiAdminforUser(
    "POST",
    `/business/edge-config/assign`,
    payload
  );
  return res?.data ?? res;
};

export const useFetchProjectEdgeConfigAdmin = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["admin-project-edge-config", { projectId, region }],
    queryFn: () => fetchProjectEdgeConfigAdmin(projectId, region),
    enabled: !!projectId && !!region,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchEdgeNetworks = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["edge-networks", { projectId, region }],
    queryFn: () => fetchEdgeNetworks({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchIpPools = (projectId, region, edgeNetworkId, options = {}) => {
  return useQuery({
    queryKey: ["ip-pools", { projectId, region, edgeNetworkId }],
    queryFn: () => fetchIpPools({ project_id: projectId, region, edge_network_id: edgeNetworkId }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useAssignProjectEdge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignProjectEdge,
    onSuccess: (data, variables) => {
      // Invalidate cached config after assignment (both admin and tenant views)
      const pid = variables?.payload?.project_id;
      const region = variables?.payload?.region;
      if (pid && region) {
        queryClient.invalidateQueries({
          queryKey: ["admin-project-edge-config", { projectId: pid, region }],
        });
        queryClient.invalidateQueries({
          queryKey: ["project-edge-config", { projectId: pid, region }],
        });
      } else if (pid) {
        // Fallback invalidation by project only
        queryClient.invalidateQueries({ queryKey: ["admin-project-edge-config"] });
        queryClient.invalidateQueries({ queryKey: ["project-edge-config"] });
      }
    },
  });
};

export const syncProjectEdgeConfigAdmin = async ({ project_id, region }) => {
  return fetchProjectEdgeConfigAdmin(project_id, region, true);
};
