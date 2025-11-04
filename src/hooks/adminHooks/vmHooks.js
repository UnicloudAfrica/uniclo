import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const buildQueryString = ({ region, page, perPage, search }) => {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (page) params.append("page", page);
  if (perPage) params.append("per_page", perPage);
  if (search) params.append("search", search);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const normaliseCollectionResponse = (res) => {
  if (!res) {
    throw new Error("Unexpected response from server");
  }
  return {
    data: res.data ?? [],
    meta: res.meta ?? res.pagination ?? null,
    message: res.message,
    success: res.success,
  };
};

const fetchVmInstances = async ({ region, page, perPage, search }) => {
  const queryString = buildQueryString({ region, page, perPage, search });
  const res = await silentApi(
    "GET",
    `/product-compute-instance${queryString}`
  );
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch VM instances");
  }
  return payload;
};

const fetchVmInstanceById = async (id) => {
  const res = await silentApi("GET", `/product-compute-instance/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to fetch VM instance with ID ${id}`);
  }
  return res.data;
};

const createVmInstance = async (instanceData) => {
  const res = await api("POST", "/product-compute-instance", instanceData);
  if (!res?.data) {
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
  if (!res?.data) {
    throw new Error(`Failed to update VM instance with ID ${id}`);
  }
  return res.data;
};

const deleteVmInstance = async (id) => {
  const res = await api("DELETE", `/product-compute-instance/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to delete VM instance with ID ${id}`);
  }
  return res.data;
};

export const useFetchVmInstances = (
  region,
  { page = 1, perPage = 10, search = "" } = {},
  options = {}
) => {
  return useQuery({
    queryKey: ["vmInstances", region, page, perPage, search],
    queryFn: () => fetchVmInstances({ region, page, perPage, search }),
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
      queryClient.invalidateQueries({ queryKey: ["vmInstances"] });
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
      queryClient.invalidateQueries({ queryKey: ["vmInstances"] });
      queryClient.invalidateQueries({
        queryKey: ["vmInstance", variables.id],
      });
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
      queryClient.invalidateQueries({ queryKey: ["vmInstances"] });
    },
    onError: (error) => {
      console.error("Error deleting VM instance:", error);
    },
  });
};

