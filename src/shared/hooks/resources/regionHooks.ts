/**
 * Region Hooks — Context-aware CRUD hooks for cloud regions.
 * Replaces duplicated region fetching across admin/tenant/client hooks.
 */
import { useQuery } from "@tanstack/react-query";
import { createResourceHooks } from "../createResourceHooks";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";
import type { AvailabilityZone } from "@/shared/types/resource";

const regionHooks = createResourceHooks({
  resourcePath: "cloud-regions",
  queryKeyBase: "regions",
});

export const {
  useFetchList: useFetchRegions,
  useFetchById: useFetchRegionById,
  useCreate: useCreateRegion,
  useUpdate: useUpdateRegion,
  useDelete: useDeleteRegion,
  queryKeys: regionKeys,
} = regionHooks;

/**
 * Context-aware hook to fetch availability zones for a region.
 * Works across admin, tenant, and client contexts.
 */
export const useFetchAvailabilityZones = (regionCode: string | null | undefined) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AvailabilityZone[]>({
    queryKey: ["availability-zones", context, regionCode],
    queryFn: async () => {
      const res = await entry.silentApi<{ data?: AvailabilityZone[] }>(
        "GET",
        `${entry.urlPrefix}/regions/${regionCode}/availability-zones`
      );
      const data = (res as any)?.data ?? (res as any);
      return Array.isArray(data) ? data : (data?.data ?? []);
    },
    enabled: !!regionCode,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export default regionHooks;
