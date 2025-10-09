// src/hooks/clientHooks/keyPairsHook.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

const fetchClientKeyPairs = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await clientSilentApi(
    "GET",
    `/business/key-pairs${queryString ? `?${queryString}` : ""}`
  );
  if (!res?.data) throw new Error("Failed to fetch key pairs");
  return res?.data;
};

const fetchClientKeyPairById = async (id) => {
  const res = await clientSilentApi("GET", `/business/key-pairs/${id}`);
  if (!res) throw new Error(`Failed to fetch key pair with ID ${id}`);
  return res;
};

const createClientKeyPair = async (keyPairData) => {
  const res = await clientApi("POST", "/business/key-pairs", keyPairData);
  if (!res) throw new Error("Failed to create key pair");
  return res;
};

const updateClientKeyPair = async ({ id, keyPairData }) => {
  const res = await clientApi(
    "PATCH",
    `/business/key-pairs/${id}`,
    keyPairData
  );
  if (!res) throw new Error(`Failed to update key pair with ID ${id}`);
  return res;
};

const deleteClientKeyPair = async ({ id, payload }) => {
  const res = await clientApi("DELETE", `/business/key-pairs/${id}`, payload);
  if (!res) throw new Error(`Failed to delete key pair with ID ${id}`);
  return res;
};

export const useFetchClientKeyPairs = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["clientKeyPairs", { projectId, region }],
    queryFn: () => fetchClientKeyPairs({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchClientKeyPairById = (id, options = {}) => {
  return useQuery({
    queryKey: ["clientKeyPair", id],
    queryFn: () => fetchClientKeyPairById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateClientKeyPair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientKeyPair,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientKeyPairs", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating key pair:", error);
    },
  });
};

export const useUpdateClientKeyPair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientKeyPair,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientKeyPairs"] });
      queryClient.invalidateQueries({
        queryKey: ["clientKeyPair", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating key pair:", error);
    },
  });
};

export const useDeleteClientKeyPair = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientKeyPair,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "clientKeyPairs",
          { projectId: variables.payload.project_id },
        ],
      });
    },
    onError: (error) => {
      console.error("Error deleting key pair:", error);
    },
  });
};
