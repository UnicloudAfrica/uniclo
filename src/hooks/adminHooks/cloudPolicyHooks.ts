import { useQuery } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import type { ApiEnvelope, QueryHookOptions } from "@/shared/types/admin";

interface CloudPoliciesParams {
  provider?: string;
  region?: string;
  active_only?: boolean | string;
}

// GET: Fetch all cloud policies
const fetchCloudPolicies = async (params: CloudPoliciesParams = {}) => {
  const query = new URLSearchParams();
  if (params.provider) {
    query.append("provider", params.provider);
  }
  if (params.region) {
    query.append("region", params.region);
  }
  if (params.active_only !== undefined) {
    query.append("active_only", String(params.active_only));
  }

  const uri = `/cloud-policies${query.toString() ? `?${query.toString()}` : ""}`;

  const res = await silentApi<ApiEnvelope<Record<string, unknown>>>("GET", uri);
  if (!res?.data) {
    throw new Error("Failed to fetch cloud policies");
  }

  return res.data;
};

// Hook to fetch cloud policies
export const useCloudPolicies = (
  params: CloudPoliciesParams = {},
  options: QueryHookOptions & { enabled?: boolean } = {}
) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["admin-cloud-policies", params],
    queryFn: () => fetchCloudPolicies(params),
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
