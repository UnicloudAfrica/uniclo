import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const fetchCrossConnects = async () => {
  const res = await silentApi("GET", "/product-cross-connect");
  if (!res.data) {
    throw new Error("Failed to fetch cross-connect products");
  }
  return res.data;
};

const fetchCrossConnectById = async (id) => {
  const res = await silentApi("GET", `/product-cross-connect/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch cross-connect product with ID ${id}`);
  }
  return res.data;
};

const createCrossConnect = async (productData) => {
  const res = await api("POST", "/product-cross-connect", productData);
  if (!res.data) {
    throw new Error("Failed to create cross-connect product");
  }
  return res.data;
};

const updateCrossConnect = async ({ id, productData }) => {
  const res = await api("PUT", `/product-cross-connect/${id}`, productData);
  if (!res.data) {
    throw new Error(`Failed to update cross-connect product with ID ${id}`);
  }
  return res.data;
};

const deleteCrossConnect = async (id) => {
  const res = await api("DELETE", `/product-cross-connect/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete cross-connect product with ID ${id}`);
  }
  return res.data;
};

export const useFetchCrossConnects = (options = {}) => {
  return useQuery({
    queryKey: ["crossConnects"],
    queryFn: fetchCrossConnects,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchCrossConnectById = (id, options = {}) => {
  return useQuery({
    queryKey: ["crossConnect", id],
    queryFn: () => fetchCrossConnectById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateCrossConnect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCrossConnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crossConnects"] });
    },
    onError: (error) => {
      console.error("Error creating cross-connect product:", error);
    },
  });
};

export const useUpdateCrossConnect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCrossConnect,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crossConnects"] });
      queryClient.invalidateQueries({
        queryKey: ["crossConnect", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating cross-connect product:", error);
    },
  });
};

export const useDeleteCrossConnect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCrossConnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crossConnects"] });
    },
    onError: (error) => {
      console.error("Error deleting cross-connect product:", error);
    },
  });
};
