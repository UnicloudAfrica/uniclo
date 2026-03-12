/**
 * Client Network Hooks
 *
 * - useFetchClientNetworkInterfaces / syncClientNetworkInterfacesFromProvider:
 *   Legacy positional-arg wrappers around shared/hooks/resources/networkHooks.
 * - useFetchClientNetworks: client-specific hook for the /business/networks endpoint
 *   (distinct from shared network-interfaces CRUD).
 */
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import networkHooksShared from "@/shared/hooks/resources/networkHooks";
import { createLegacyWrappers, createSyncFunction } from "@/shared/hooks/createLegacyWrappers";

const legacy = createLegacyWrappers(networkHooksShared);
const syncFn = createSyncFunction("network-interfaces");

/** @deprecated Use useFetchNetworks from shared/hooks/resources/networkHooks with ListParams */
export const useFetchClientNetworkInterfaces = legacy.useFetchList;

/** @deprecated Use useSyncNetworks from shared/hooks/resources/networkHooks */
export const syncClientNetworkInterfacesFromProvider = syncFn;

// --- Fetch networks (client-specific /business/networks endpoint) ---

type QueryParams = Record<string, string | boolean | number | undefined | null>;

const buildQueryString = (params: QueryParams) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });
  return search.toString();
};

const fetchClientNetworks = async ({
  project_id,
  region,
  refresh = false,
}: {
  project_id?: string;
  region?: string;
  refresh?: boolean;
}) => {
  const queryString = buildQueryString({
    project_id,
    region,
    refresh: refresh ? "1" : undefined,
  });

  const res = await clientSilentApi<{ data: unknown[] }>(
    "GET",
    `/business/networks${queryString ? `?${queryString}` : ""}`
  );

  if (!res?.data) {
    throw new Error("Failed to fetch networks");
  }

  return res.data;
};

export const useFetchClientNetworks = (
  projectId?: string,
  region?: string,
  options: Omit<UseQueryOptions<unknown[], Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["clientNetworks", { projectId, region }],
    queryFn: () => fetchClientNetworks({ project_id: projectId, region }),
    enabled: Boolean(projectId && region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
