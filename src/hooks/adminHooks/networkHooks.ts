/**
 * Admin Network Hooks
 *
 * - useFetchNetworkInterfaces / syncNetworkInterfacesFromProvider:
 *   Legacy positional-arg wrappers around shared/hooks/resources/networkHooks.
 * - useFetchNetworks: admin-specific hook for the /networks endpoint
 *   (distinct from shared network-interfaces CRUD).
 */
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { adminSilentApi } from "../../index/admin/api";
import networkHooksShared from "@/shared/hooks/resources/networkHooks";
import { createLegacyWrappers, createSyncFunction } from "@/shared/hooks/createLegacyWrappers";

const legacy = createLegacyWrappers(networkHooksShared);
const syncFn = createSyncFunction("network-interfaces");

/** @deprecated Use useFetchNetworks from shared/hooks/resources/networkHooks with ListParams */
export const useFetchNetworkInterfaces = legacy.useFetchList;

/** @deprecated Use useSyncNetworks from shared/hooks/resources/networkHooks */
export const syncNetworkInterfacesFromProvider = syncFn;

// --- Fetch networks (admin-specific /networks endpoint, NOT /network-interfaces) ---

const fetchNetworks = async ({
  project_id,
  region,
  refresh = false,
}: {
  project_id?: string;
  region?: string;
  refresh?: boolean;
}) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await adminSilentApi<{ data?: Record<string, unknown> }>(
    "GET",
    `/networks${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch networks");
  return res.data;
};

export const useFetchNetworks = (
  projectId: string | undefined,
  region: string | undefined,
  options: Omit<UseQueryOptions<Record<string, unknown>>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["networks", { projectId, region }],
    queryFn: () =>
      fetchNetworks({ project_id: projectId, region }) as Promise<Record<string, unknown>>,
    enabled: Boolean(projectId && region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
