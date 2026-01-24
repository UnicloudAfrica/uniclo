import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext } from "./useApiContext";

const getEndpoint = (apiBaseUrl: string) => `${apiBaseUrl}/settings/tenant/network`;

export const useFetchTenantNetworkSettings = (options: { enabled?: boolean } = {}) => {
  const { apiBaseUrl, authHeaders, isAuthenticated, context } = useApiContext();

  const endpoint = getEndpoint(apiBaseUrl);

  return useQuery({
    queryKey: ["tenant-network-settings", context],
    queryFn: async () => {
      const { data } = await axios.get(endpoint, {
        headers: authHeaders,
        withCredentials: true,
      });
      return data?.data ?? data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: (options.enabled ?? true) && isAuthenticated,
  });
};
