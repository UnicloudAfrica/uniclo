import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";

// Admin: fetch project edge configuration
const fetchProjectEdgeConfigAdmin = async (projectId) => {
  if (!projectId) throw new Error("projectId is required");
  try {
    const res = await adminSilentApiforUser(
      "GET",
      `/business/projects/${projectId}/edge-config`
    );
    return res?.data ?? res;
  } catch (e) {
    // If not found or not yet assigned, return null so UI can show a friendly warning
    return null;
  }
};

// Admin: list available edge networks (optionally scoped by project)
const fetchEdgeNetworks = async ({ project_id }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  const res = await adminSilentApiforUser(
    "GET",
    `/business/edge-networks${params.toString() ? `?${params}` : ""}`
  );
  return res?.data ?? res;
};

// Admin: list available IP pools (optionally scoped by project)
const fetchIpPools = async ({ project_id }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  const res = await adminSilentApiforUser(
    "GET",
    `/business/ip-pools${params.toString() ? `?${params}` : ""}`
  );
  return res?.data ?? res;
};

// Admin: assign or update edge config for a project
const assignProjectEdge = async ({ projectId, payload }) => {
  if (!projectId) throw new Error("projectId is required");
  const res = await apiAdminforUser(
    "POST",
    `/business/projects/${projectId}/edge-config`,
    payload
  );
  return res?.data ?? res;
};

export const useFetchProjectEdgeConfigAdmin = (projectId, options = {}) => {
  return useQuery({
    queryKey: ["admin-project-edge-config", { projectId }],
    queryFn: () => fetchProjectEdgeConfigAdmin(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchEdgeNetworks = (projectId, options = {}) => {
  return useQuery({
    queryKey: ["edge-networks", { projectId }],
    queryFn: () => fetchEdgeNetworks({ project_id: projectId }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchIpPools = (projectId, options = {}) => {
  return useQuery({
    queryKey: ["ip-pools", { projectId }],
    queryFn: () => fetchIpPools({ project_id: projectId }),
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
      // Invalidate cached config after assignment
      queryClient.invalidateQueries({
        queryKey: ["admin-project-edge-config", { projectId: variables.projectId }],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-edge-config", { projectId: variables.projectId }],
      });
    },
  });
};
