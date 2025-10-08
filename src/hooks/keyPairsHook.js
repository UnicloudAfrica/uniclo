// src/hooks/adminHooks/keyPairHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../index/silent";
import api from "../index/api";
// import silentTenantApi from "../index/tenant/silentTenant";
// import tenantApi from "../index/tenant/tenantApi";

const fetchKeyPairs = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/business/key-pairs${queryString ? `?${queryString}` : ""}`
  );
  if (!res?.data) throw new Error("Failed to fetch key pairs");
  return res?.data;
};

const fetchKeyPairById = async (id) => {
  const res = await silentApi("GET", `/business/key-pairs/${id}`);
  if (!res) throw new Error(`Failed to fetch key pair with ID ${id}`);
  return res;
};

const createKeyPair = async (keyPairData) => {
  const res = await api("POST", "/business/key-pairs", keyPairData);
  if (!res) throw new Error("Failed to create key pair");
  return res;
};

const updateKeyPair = async ({ id, keyPairData }) => {
  const res = await api("PATCH", `/business/key-pairs/${id}`, keyPairData);
  if (!res) throw new Error(`Failed to update key pair with ID ${id}`);
  return res;
};

const deleteKeyPair = async (id) => {
  const res = await api("DELETE", `/business/key-pairs/${id}`);
  if (!res) throw new Error(`Failed to delete key pair with ID ${id}`);
  return res;
};

export const useFetchTenantKeyPairs = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["keyPairs", { projectId, region }],
    queryFn: () => fetchKeyPairs({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchKeyPairById = (id, options = {}) => {
  return useQuery({
    queryKey: ["keyPair", id],
    queryFn: () => fetchKeyPairById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantKeyPair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKeyPair,
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: ["keyPairs"] });
    },
    onError: (error) => {
      console.error("Error creating key pair:", error);
    },
  });
};

export const useUpdateTenantKeyPair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateKeyPair,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["keyPairs"] });
      queryClient.invalidateQueries({ queryKey: ["keyPair", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating key pair:", error);
    },
  });
};

export const useDeleteTenantKeyPair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKeyPair,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keyPairs"] });
    },
    onError: (error) => {
      console.error("Error deleting key pair:", error);
    },
  });
};
