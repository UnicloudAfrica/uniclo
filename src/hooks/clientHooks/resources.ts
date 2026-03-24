import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";

// **GET**: fetchProfile
const fetchProfile = async () => {
  const res = await clientSilentApi<{ data: unknown }>("GET", "/business/profile");
  return res.data;
};

const fetchProductPricing = async (region?: string, productable_type?: string) => {
  const params = new URLSearchParams();
  if (region) {
    params.append("region", region);
  }
  if (productable_type) {
    params.append("productable_type", productable_type);
  }
  const res = await clientSilentApi<{ data: unknown }>(
    "GET",
    `/product-pricing?${params.toString()}`
  );
  return res.data;
};

// Hook to fetch Profile
export const useFetchClientProfile = (
  options: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn"> = {}
) => {
  const queryClient = useQueryClient();
  const profileQueryState = queryClient.getQueryState(["client-profile"]);

  const shouldEnable = !profileQueryState || profileQueryState.status !== "error";

  return useQuery({
    queryKey: ["client-profile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    enabled: shouldEnable,
    ...options,
  });
};

export const useFetchProductPricing = (
  region?: string,
  productable_type?: string,
  options: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["product-pricing", region, productable_type],
    queryFn: () => fetchProductPricing(region, productable_type),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
