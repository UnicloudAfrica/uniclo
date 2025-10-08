import { useQuery } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";

// Fetch the tenant-visible edge configuration for a project
// GET /tenant/v1/admin/edge-config?project_id={identifier}&region={code}
const fetchProjectEdgeConfigTenant = async (projectId, region) => {
  if (!projectId) throw new Error("projectId is required");
  if (!region) throw new Error("region is required");
  try {
    const params = new URLSearchParams();
    params.append("project_id", projectId);
    params.append("region", region);
    const res = await silentTenantApi(
      "GET",
      `/admin/edge-config?${params.toString()}`
    );
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
