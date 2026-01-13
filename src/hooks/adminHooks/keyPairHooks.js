import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi, { adminSilentApi } from "../../index/admin/api";

const fetchKeyPairs = async ({ project_id, region, refresh = false }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await adminSilentApi(
    "GET",
    `/key-pairs${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch key pairs");
  return res.data;
};

export const syncKeyPairsFromProvider = async ({ project_id, region }) => {
  return fetchKeyPairs({ project_id, region, refresh: true });
};

const fetchKeyPairById = async (id) => {
  const res = await adminSilentApi("GET", `/key-pairs/${id}`);
  if (!res.data) throw new Error(`Failed to fetch key pair with ID ${id}`);
  return res.data;
};

const createKeyPair = async (keyPairData) => {
  const res = await adminApi("POST", "/key-pairs", keyPairData);
  if (!res) throw new Error("Failed to create key pair");
  return res;
};

const updateKeyPair = async ({ id, keyPairData }) => {
  const res = await adminApi("PATCH", `/key-pairs/${id}`, keyPairData);
  if (!res.data) throw new Error(`Failed to update key pair with ID ${id}`);
  return res.data;
};

const deleteKeyPair = async (id) => {
  const res = await adminApi("DELETE", `/key-pairs/${id}`);
  if (!res.data) throw new Error(`Failed to delete key pair with ID ${id}`);
  return res.data;
};

export const useFetchKeyPairs = (projectId, region, options = {}) => {
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

export const useCreateKeyPair = () => {
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

export const useUpdateKeyPair = () => {
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

export const useDeleteKeyPair = () => {
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
