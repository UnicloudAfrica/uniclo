import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";

const fetchTenantKeyPairs = async ({ project_id, region, refresh = false }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await tenantSilentApi(
    "GET",
    `/admin/key-pairs${queryString ? `?${queryString}` : ""}`
  );
  if (!res?.data) throw new Error("Failed to fetch key pairs");
  return res.data;
};

const fetchTenantKeyPairById = async (id) => {
  const res = await tenantSilentApi("GET", `/admin/key-pairs/${id}`);
  if (!res) throw new Error(`Failed to fetch key pair with ID ${id}`);
  return res;
};

const createTenantKeyPair = async (keyPairData) => {
  const res = await tenantApi("POST", "/admin/key-pairs", keyPairData);
  if (!res) throw new Error("Failed to create key pair");
  return res;
};

const updateTenantKeyPair = async ({ id, keyPairData }) => {
  const res = await tenantApi("PATCH", `/admin/key-pairs/${id}`, keyPairData);
  if (!res) throw new Error(`Failed to update key pair with ID ${id}`);
  return res;
};

const deleteTenantKeyPair = async ({ id, payload }) => {
  const res = await tenantApi("DELETE", `/admin/key-pairs/${id}`, payload);
  if (!res) throw new Error(`Failed to delete key pair with ID ${id}`);
  return res;
};

export const useFetchTenantKeyPairs = (projectId, region, options = {}) =>
  useQuery({
    queryKey: ["tenantKeyPairs", { projectId, region }],
    queryFn: () => fetchTenantKeyPairs({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useFetchTenantKeyPairById = (id, options = {}) =>
  useQuery({
    queryKey: ["tenantKeyPair", id],
    queryFn: () => fetchTenantKeyPairById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useCreateTenantKeyPair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantKeyPair,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenantKeyPairs", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating key pair:", error);
    },
  });
};

export const useUpdateTenantKeyPair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantKeyPair,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenantKeyPairs"] });
      queryClient.invalidateQueries({
        queryKey: ["tenantKeyPair", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating key pair:", error);
    },
  });
};

export const useDeleteTenantKeyPair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenantKeyPair,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenantKeyPairs", { projectId: variables.payload.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error deleting key pair:", error);
    },
  });
};

export const syncTenantKeyPairsFromProvider = async ({ project_id, region }) =>
  fetchTenantKeyPairs({ project_id, region, refresh: true });
