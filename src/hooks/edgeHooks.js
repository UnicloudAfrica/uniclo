import { useQuery } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";

// Fetch the tenant-visible edge configuration for a project
// GET /admin/projects/{id}/edge-config
const fetchProjectEdgeConfigTenant = async (projectId) => {
  if (!projectId) throw new Error("projectId is required");
  const res = await silentTenantApi("GET", `/admin/projects/${projectId}/edge-config`);
  // Some backends wrap the payload under data; tolerate both
  return res?.data ?? res;
};

export const useFetchProjectEdgeConfigTenant = (projectId, options = {}) => {
  return useQuery({
    queryKey: ["project-edge-config", { projectId }],
    queryFn: () => fetchProjectEdgeConfigTenant(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
