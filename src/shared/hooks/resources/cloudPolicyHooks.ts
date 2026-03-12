/**
 * Cloud Policy Hooks — Context-aware hooks for cloud policies.
 *
 * Fetches available Strato/AWS policies from the cloud-policies endpoint.
 * Works across admin, tenant, and client dashboards via useApiContext().
 */
import { useQuery } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";

export interface CloudPolicy {
  id: string | number;
  key: string;
  name: string;
  description?: string;
  provider?: string;
  is_default?: boolean;
  is_compulsory?: boolean;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Fetch cloud policies available for a given provider/region.
 *
 * @param params.provider - Cloud provider (e.g. "zadara")
 * @param params.region - Region code (e.g. "lagos-1")
 * @param params.active_only - Only return active policies (default: true)
 */
export const useCloudPolicies = (
  params: { provider?: string; region?: string; active_only?: string } = {},
  options: { enabled?: boolean } = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<CloudPolicy[]>({
    queryKey: ["cloud-policies", context, params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params.provider) query.append("provider", params.provider);
      if (params.region) query.append("region", params.region);
      if (params.active_only !== undefined) query.append("active_only", params.active_only);

      const uri = `${entry.urlPrefix}/cloud-policies${query.toString() ? `?${query.toString()}` : ""}`;
      const res = await entry.silentApi("GET", uri);

      if (!res?.data) {
        return [];
      }

      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};
