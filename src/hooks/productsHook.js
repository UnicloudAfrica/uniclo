import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

// **GET**: fetch products
const fetchProducts = async () => {
  const res = await silentApi("GET", "/products");
  return res.data; // Extract only the data array
};

// Hook to fetch products
export const useFetchProducts = (options = {}) => {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
