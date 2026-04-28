import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";

const fetchRegions = async (): Promise<unknown> => {
  const res = await tenantSilentApi<{ data?: unknown }>("GET", "/regions");
  if (!res.data) throw new Error("Failed to fetch regions");
  return res.data;
};

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const useFetchTenantRegions = (options: QueryOptions<unknown> = {}) => {
  return useQuery({
    queryKey: ["tenant-regions"],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    ...options,
  });
};
