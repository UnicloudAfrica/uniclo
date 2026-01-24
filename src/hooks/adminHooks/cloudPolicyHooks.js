import { useQuery } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";

// GET: Fetch all cloud policies
const fetchCloudPolicies = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.provider) {
    query.append("provider", params.provider);
  }
  if (params.region) {
    query.append("region", params.region);
  }
  if (params.active_only !== undefined) {
    query.append("active_only", params.active_only);
  }

  const uri = `/cloud-policies${query.toString() ? `?${query.toString()}` : ""}`;

  const res = await silentApi("GET", uri);
  if (!res?.data) {
    throw new Error("Failed to fetch cloud policies");
  }

  return res.data;
};

// Hook to fetch cloud policies
export const useCloudPolicies = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["admin-cloud-policies", params],
    queryFn: () => fetchCloudPolicies(params),
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
