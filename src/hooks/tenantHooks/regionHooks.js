import { useQuery } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";

const fetchRegions = async () => {
  const res = await tenantSilentApi("GET", "/regions");
  if (!res.data) throw new Error("Failed to fetch regions");
  return res.data;
};

export const useFetchTenantRegions = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-regions"],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    ...options,
  });
};
