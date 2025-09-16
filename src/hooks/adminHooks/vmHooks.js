import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const fetchVmInstances = async (region) => {
  const res = await silentApi(
    "GET",
    `/product-compute-instance?region=${region}`
  );
  if (!res.data) {
    throw new Error("Failed to fetch VM instances");
  }
  return res.data;
};

const fetchVmInstanceById = async (id) => {
  const res = await silentApi("GET", `/product-compute-instance/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch VM instance with ID ${id}`);
  }
  return res.data;
};

const createVmInstance = async (instanceData) => {
  const res = await api("POST", "/product-compute-instance", instanceData);
  if (!res.data) {
    throw new Error("Failed to create VM instance");
  }
  return res.data;
};

const updateVmInstance = async ({ id, instanceData }) => {
  const res = await api(
    "PATCH",
    `/product-compute-instance/${id}`,
    instanceData
  );
  if (!res.data) {
    throw new Error(`Failed to update VM instance with ID ${id}`);
  }
  return res.data;
};

const deleteVmInstance = async (id) => {
  const res = await api("DELETE", `/product-compute-instance/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete VM instance with ID ${id}`);
  }
  return res.data;
};

export const useFetchVmInstances = (region, options = {}) => {
  return useQuery({
    queryKey: ["vmInstances", region],
    queryFn: () => fetchVmInstances(region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useFetchVmInstanceById = (id, options = {}) => {
  return useQuery({
    queryKey: ["vmInstance", id],
    queryFn: () => fetchVmInstanceById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateVmInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVmInstance,
    onSuccess: () => {
      queryClient.invalidateQueries(["vmInstances"]);
    },
    onError: (error) => {
      console.error("Error creating VM instance:", error);
    },
  });
};

export const useUpdateVmInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVmInstance,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["vmInstances"]);
      queryClient.invalidateQueries(["vmInstance", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating VM instance:", error);
    },
  });
};

export const useDeleteVmInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVmInstance,
    onSuccess: () => {
      queryClient.invalidateQueries(["vmInstances"]);
    },
    onError: (error) => {
      console.error("Error deleting VM instance:", error);
    },
  });
};
