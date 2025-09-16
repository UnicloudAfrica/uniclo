import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const fetchProducts = async (country_code, provider) => {
  const params = [];
  if (country_code)
    params.push(`country_code=${encodeURIComponent(country_code)}`);
  if (provider) params.push(`provider=${encodeURIComponent(provider)}`);
  const queryString = params.length > 0 ? `?${params.join("&")}` : "";
  const res = await silentApi("GET", `/products${queryString}`);
  if (!res.data) {
    throw new Error("Failed to fetch product pricing");
  }
  return res.data;
};

const createProducts = async (productData) => {
  const res = await api("POST", "/products", productData);
  if (!res.data) {
    throw new Error("Failed to create product pricing");
  }
  return res.data;
};

const updateProduct = async ({ id, productData }) => {
  const res = await api("PUT", `/products/${id}`, productData);
  if (!res.data) {
    throw new Error("Failed to update product");
  }
  return res.data;
};

const deleteProduct = async (id) => {
  const res = await api("DELETE", `/products/${id}`);
  if (!res.data) {
    throw new Error("Failed to delete product");
  }
  return res.data;
};

export const useFetchProducts = (
  country_code = "",
  provider = "",
  options = {}
) => {
  return useQuery({
    queryKey: ["productsadmin", country_code || "none", provider || "none"],
    queryFn: () => fetchProducts(country_code, provider),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProducts,
    onSuccess: () => {
      queryClient.invalidateQueries(["productsadmin"]);
    },
    onError: (error) => {
      console.error("Error creating product pricing:", error);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(["productsadmin"]);
    },
    onError: (error) => {
      console.error("Error updating product:", error);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(["productsadmin"]);
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
    },
  });
};
