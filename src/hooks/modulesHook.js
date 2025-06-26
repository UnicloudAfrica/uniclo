import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

const fetchModules = async () => {
  const res = await silentApi("GET", "/business/product-provisioning");
  return res.data; // Extract only the data array
};

// Hook to fetch transactions
export const useFetchModules = (options = {}) => {
  return useQuery({
    queryKey: ["modules"],
    queryFn: fetchModules,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
