import { useQuery } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";

// GET /api/v1/business/edge-config?project_id={identifier}&region={code}
const fetchClientProjectEdgeConfig = async (projectId, region) => {
  if (!projectId) throw new Error("projectId is required");
  if (!region) throw new Error("region is required");
  try {
    const params = new URLSearchParams();
    params.append("project_id", projectId);
    params.append("region", region);
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
