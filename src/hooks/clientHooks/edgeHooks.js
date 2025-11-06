import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

const normalizeCollection = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.edge_networks)) return payload.edge_networks;
  if (Array.isArray(payload.edge_network_ip_pools)) return payload.edge_network_ip_pools;
  if (Array.isArray(payload.pools)) return payload.pools;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data) return normalizeCollection(payload.data);
  return [];
};

// GET /api/v1/business/edge-config?project_id={identifier}&region={code}
const fetchClientProjectEdgeConfig = async (
  projectId,
  region,
  refresh = false
) => {
  if (!projectId) throw new Error("projectId is required");
  if (!region) throw new Error("region is required");
  try {
    const params = new URLSearchParams();
    params.append("project_id", projectId);
    params.append("region", region);
    if (refresh) params.append("refresh", "1");
    const res = await clientSilentApi(
      "GET",
      `/business/edge-config?${params.toString()}`
    );
    return res?.data ?? res;
  } catch (e) {
    return null;
  }
};

export const useFetchClientProjectEdgeConfig = (
  projectId,
  region,
  options = {}
) => {
  return useQuery({
    queryKey: ["clientProjectEdgeConfig", { projectId, region }],
    queryFn: () => fetchClientProjectEdgeConfig(projectId, region),
    enabled: !!projectId && !!region,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

const fetchClientEdgeNetworks = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  const res = await clientSilentApi(
    "GET",
    `/business/edge-networks${params.toString() ? `?${params}` : ""}`
  );
  return normalizeCollection(res?.data ?? res);
};

const fetchClientIpPools = async ({ project_id, region, edge_network_id }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (edge_network_id) params.append("edge_network_id", edge_network_id);
  const res = await clientSilentApi(
    "GET",
    `/business/edge-ip-pools${params.toString() ? `?${params}` : ""}`
  );
  return normalizeCollection(res?.data ?? res);
};

const assignClientProjectEdge = async ({ payload }) => {
  const res = await clientApi("POST", "/business/edge-config/assign", payload);
  return res?.data ?? res;
};

export const useFetchClientEdgeNetworks = (projectId, region, options = {}) =>
  useQuery({
    queryKey: ["client-edge-networks", { projectId, region }],
    queryFn: () => fetchClientEdgeNetworks({ project_id: projectId, region }),
    enabled: !!region,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useFetchClientIpPools = (
  projectId,
  region,
  edgeNetworkId,
  options = {}
) =>
  useQuery({
    queryKey: ["client-edge-ip-pools", { projectId, region, edgeNetworkId }],
    queryFn: () =>
      fetchClientIpPools({
        project_id: projectId,
        region,
        edge_network_id: edgeNetworkId,
      }),
    enabled: !!region && !!edgeNetworkId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useAssignClientProjectEdge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignClientProjectEdge,
    onSuccess: (data, variables) => {
      const pid = variables?.payload?.project_id;
      const region = variables?.payload?.region;
      if (pid && region) {
        queryClient.invalidateQueries({
          queryKey: ["clientProjectEdgeConfig", { projectId: pid, region }],
        });
      } else if (pid) {
        queryClient.invalidateQueries({ queryKey: ["clientProjectEdgeConfig"] });
      }
    },
  });
};

export const syncClientProjectEdgeConfig = async ({ project_id, region }) =>
  fetchClientProjectEdgeConfig(project_id, region, true);
