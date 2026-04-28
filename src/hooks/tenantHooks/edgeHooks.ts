import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";

const normalizeCollection = (payload: unknown): unknown[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.edge_networks)) return record.edge_networks;
  if (Array.isArray(record.edge_network_ip_pools)) return record.edge_network_ip_pools;
  if (Array.isArray(record.pools)) return record.pools;
  if (Array.isArray(record.data)) return record.data;
  if (record.data) {
    return normalizeCollection(record.data);
  }
  return [];
};

type EdgeEnvelope<T = unknown> = { data?: T };

const fetchTenantEdgeNetworks = async ({
  project_id,
  region,
}: {
  project_id?: string;
  region?: string;
}) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  const response = await silentTenantApi<EdgeEnvelope>(
    "GET",
    `/admin/edge-networks${params.toString() ? `?${params}` : ""}`
  );
  return normalizeCollection(response?.data ?? response);
};

const fetchTenantIpPools = async ({
  project_id,
  region,
  edge_network_id,
}: {
  project_id?: string;
  region?: string;
  edge_network_id?: string;
}) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (edge_network_id) params.append("edge_network_id", edge_network_id);
  const response = await silentTenantApi<EdgeEnvelope>(
    "GET",
    `/admin/edge-ip-pools${params.toString() ? `?${params}` : ""}`
  );
  return normalizeCollection(response?.data ?? response);
};

const assignTenantProjectEdge = async ({
  payload,
}: {
  payload: Record<string, unknown>;
}): Promise<unknown> => {
  const response = await tenantApi<EdgeEnvelope>("POST", "/admin/edge-config/assign", payload);
  return response?.data ?? response;
};

export const useFetchTenantEdgeNetworks = (
  projectId: string,
  region: string,
  options: Record<string, unknown> = {}
) =>
  useQuery({
    queryKey: ["tenant-edge-networks", { projectId, region }],
    queryFn: () => fetchTenantEdgeNetworks({ project_id: projectId, region }),
    enabled: !!region,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useFetchTenantIpPools = (
  projectId: string,
  region: string,
  edgeNetworkId: string,
  options: Record<string, unknown> = {}
) =>
  useQuery({
    queryKey: ["tenant-edge-ip-pools", { projectId, region, edgeNetworkId }],
    queryFn: () =>
      fetchTenantIpPools({
        project_id: projectId,
        region,
        edge_network_id: edgeNetworkId,
      }),
    enabled: !!projectId && !!region && !!edgeNetworkId,
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

const fetchTenantProjectEdgeConfig = async (projectId: string, region: string, refresh = false) => {
  if (!projectId) throw new Error("projectId is required");
  if (!region) throw new Error("region is required");
  try {
    const params = new URLSearchParams();
    params.append("project_id", projectId);
    params.append("region", region);
    if (refresh) params.append("refresh", "1");
    const res = await silentTenantApi<EdgeEnvelope>(
      "GET",
      `/admin/edge-config?${params.toString()}`
    );
    return res?.data ?? res;
  } catch (_e) {
    return null;
  }
};

export const useFetchTenantProjectEdgeConfig = (
  projectId: string,
  region: string,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["tenantProjectEdgeConfig", { projectId, region }],
    queryFn: () => fetchTenantProjectEdgeConfig(projectId, region),
    enabled: !!projectId && !!region,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const syncTenantProjectEdgeConfig = async ({
  project_id,
  region,
}: {
  project_id: string;
  region: string;
}) => fetchTenantProjectEdgeConfig(project_id, region, true);
