import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

// **GET**: fetch products offexrs
const fetchProductOffers = async () => {
  const res = await clientSilentApi("GET", "/product-offers");
  return res; // Extract only the data array
};

// Hook to fetch products
export const useFetchClientProductOffers = (options = {}) => {
  return useQuery({
    queryKey: ["products-offers"],
    queryFn: fetchProductOffers,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
