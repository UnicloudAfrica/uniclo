import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import silentApi from "../index/silent";

const fetchMarketingPartners = async () => {
  const res = await silentApi("GET", "/marketing/partners");
  return res?.data || [];
};

type MarketingPartnersOptions = UseQueryOptions<unknown[], Error, unknown[], readonly unknown[]>;

export const useFetchMarketingPartners = (options: MarketingPartnersOptions = {}) => {
  const { enabled = typeof window !== "undefined", ...rest } = options;

  return useQuery({
    queryKey: ["marketing-partners"],
    queryFn: fetchMarketingPartners,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    enabled,
    ...rest,
  });
};
