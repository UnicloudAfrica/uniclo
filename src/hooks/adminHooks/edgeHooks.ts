import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";
import { EdgeConfig, EdgeNetwork, EdgeIpPool, AssignEdgePayload } from "@/shared/types/edge";
import { ApiResponse } from "@/shared/types/resource";

// Admin: fetch project edge configuration
const fetchProjectEdgeConfigAdmin = async (
  projectId: string | number,
  region: string,
  refresh: boolean = false
): Promise<EdgeConfig | null> => {
  if (!projectId) throw new Error("projectId is required");
  if (!region) throw new Error("region is required");
  try {
    const params = new URLSearchParams();
    params.append("project_id", String(projectId));
    params.append("region", region);
    if (refresh) params.append("refresh", "1");
    const res = await adminSilentApiforUser<ApiResponse<EdgeConfig>>(
      "GET",
      `/edge-config?${params.toString()}`
    );
    return res?.data ?? (res as unknown as EdgeConfig) ?? null;
  } catch {
    return null;
  }
};

// Admin: list available edge networks (optionally scoped by project)
const normalizeCollection = <T>(payload: unknown): T[] => {
  if (!payload) return [];
  const record = payload as Record<string, any>;
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.edge_networks)) return record.edge_networks as T[];
  if (Array.isArray(record.edge_network_ip_pools)) {
    return record.edge_network_ip_pools as T[];
  }
  if (Array.isArray(record.pools)) return record.pools as T[];
  if (Array.isArray(record.data)) return record.data as T[];
  if (record.data) {
    return normalizeCollection<T>(record.data);
  }
  return [];
};

const fetchEdgeNetworks = async ({
  project_id,
  region,
}: {
  project_id?: string | number;
  region?: string;
}): Promise<EdgeNetwork[]> => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", String(project_id));
  if (region) params.append("region", region);
  const res = await adminSilentApiforUser(
    "GET",
    `/edge-networks${params.toString() ? `?${params.toString()}` : ""}`
  );
  return normalizeCollection<EdgeNetwork>(res);
};

// Admin: list available IP pools (optionally scoped by project)
const fetchIpPools = async ({
  project_id,
  region,
  edge_network_id,
}: {
  project_id?: string | number;
  region?: string;
  edge_network_id?: string;
}): Promise<EdgeIpPool[]> => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", String(project_id));
  if (region) params.append("region", region);
  if (edge_network_id) params.append("edge_network_id", edge_network_id);
  const res = await adminSilentApiforUser(
    "GET",
    `/edge-ip-pools${params.toString() ? `?${params.toString()}` : ""}`
  );
  return normalizeCollection<EdgeIpPool>(res);
};

// Admin: assign or update edge config for a project
const assignProjectEdge = async ({
  payload,
}: {
  payload: AssignEdgePayload;
}): Promise<EdgeConfig> => {
  const res = await apiAdminforUser<ApiResponse<EdgeConfig>>(
    "POST",
    `/edge-config/assign`,
    payload as Record<string, unknown>
  );
  return (res?.data ?? res) as EdgeConfig;
};

export const useFetchProjectEdgeConfigAdmin = (
  projectId: string | number | undefined,
  region: string | undefined,
  options: Omit<UseQueryOptions<EdgeConfig | null>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["admin-project-edge-config", { projectId, region }],
    queryFn: () => fetchProjectEdgeConfigAdmin(projectId!, region!),
    enabled: !!projectId && !!region,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchEdgeNetworks = (
  projectId: string | number | undefined,
  region: string | undefined,
  options: Omit<UseQueryOptions<EdgeNetwork[]>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["edge-networks", { projectId, region }],
    queryFn: () =>
      fetchEdgeNetworks({
        ...(projectId ? { project_id: projectId } : {}),
        ...(region ? { region } : {}),
      }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchIpPools = (
  projectId: string | number | undefined,
  region: string | undefined,
  edgeNetworkId: string | undefined,
  options: Omit<UseQueryOptions<EdgeIpPool[]>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["ip-pools", { projectId, region, edgeNetworkId }],
    queryFn: () =>
      fetchIpPools({
        ...(projectId ? { project_id: projectId } : {}),
        ...(region ? { region } : {}),
        ...(edgeNetworkId ? { edge_network_id: edgeNetworkId } : {}),
      }),
    enabled: !!projectId && !!region && !!edgeNetworkId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useAssignProjectEdge = (
  options: Omit<
    UseMutationOptions<EdgeConfig, Error, { payload: AssignEdgePayload }>,
    "mutationFn"
  > = {}
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignProjectEdge,
    ...options,
    onSuccess: (data, variables, context) => {
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

      if (options.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
};

export const syncProjectEdgeConfigAdmin = async ({
  project_id,
  region,
}: {
  project_id: string | number;
  region: string;
}) => {
  return fetchProjectEdgeConfigAdmin(project_id, region, true);
};
