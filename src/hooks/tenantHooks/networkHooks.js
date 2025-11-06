import { useQuery } from "@tanstack/react-query";
import silentApi from "../../index/silent";

const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};

const fetchTenantNetworks = async ({ project_id, region, refresh = false }) => {
  const queryString = buildQueryString({
    project_id,
    region,
    refresh: refresh ? "1" : undefined,
  });

  const response = await silentApi(
    "GET",
    `/business/networks${queryString ? `?${queryString}` : ""}`
  );

  if (!response?.data) {
    throw new Error("Failed to fetch networks");
  }

  return response.data;
};

export const useFetchTenantNetworks = (projectId, region, options = {}) =>
  useQuery({
    queryKey: ["tenantNetworks", { projectId, region }],
    queryFn: () => fetchTenantNetworks({ project_id: projectId, region }),
    enabled: Boolean(projectId && region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const syncTenantNetworksFromProvider = async ({ project_id, region }) =>
  fetchTenantNetworks({ project_id, region, refresh: true });
