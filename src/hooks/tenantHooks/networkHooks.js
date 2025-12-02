import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/silent";
import ToastUtils from "../../utils/toastUtil";

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

const createTenantNetwork = async (payload) => {
  const response = await silentApi("POST", "/business/networks", payload);
  if (!response) throw new Error("Failed to create network");
  return response;
};

const deleteTenantNetwork = async (networkId) => {
  const response = await silentApi("DELETE", `/business/networks/${networkId}`);
  if (!response) throw new Error("Failed to delete network");
  return response;
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

export const useCreateTenantNetwork = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantNetwork,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenantNetworks", { projectId: variables.project_id }],
      });
      ToastUtils.success("Network created successfully");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to create network");
    },
  });
};

export const useDeleteTenantNetwork = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenantNetwork,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantNetworks"] });
      ToastUtils.success("Network deleted successfully");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to delete network");
    },
  });
};

export const syncTenantNetworksFromProvider = async ({ project_id, region }) =>
  fetchTenantNetworks({ project_id, region, refresh: true });

