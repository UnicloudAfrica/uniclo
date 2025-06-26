import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

// **GET**: fetchSubs
const fetchSubs = async () => {
  const res = await silentApi("GET", "/business/subscription");
  return res.data; // Extract only the data array
};

// Hook to fetch subs
export const useFetchSubs = (options = {}) => {
  return useQuery({
    queryKey: ["subs"],
    queryFn: fetchSubs,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
