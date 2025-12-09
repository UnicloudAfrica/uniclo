import { useQuery } from "@tanstack/react-query";
import silentApi from "../index/silent";

// Fetch the tenant-visible edge configuration for a project
// GET /api/v1/business/edge-config?project_id={identifier}&region={code}
const fetchProjectEdgeConfigTenant = async (projectId, region, refresh = false) => {
  if (!projectId) throw new Error("projectId is required");
  if (!region) throw new Error("region is required");
  try {
    const params = new URLSearchParams();
    params.append("project_id", projectId);
    params.append("region", region);
    if (refresh) params.append("refresh", "1");
    const res = await silentApi("GET", `/business/edge-config?${params.toString()}`);
    return res?.data ?? res;
  } catch (e) {
    return null;
  }
};

export const useFetchProjectEdgeConfigTenant = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["project-edge-config", { projectId, region }],
    queryFn: () => fetchProjectEdgeConfigTenant(projectId, region),
    enabled: !!projectId && !!region,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const syncTenantProjectEdgeConfig = async ({ project_id, region }) =>
  fetchProjectEdgeConfigTenant(project_id, region, true);
