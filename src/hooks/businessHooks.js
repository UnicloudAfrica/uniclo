import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

// POST: verify a buisness
const verifyBusiness = async (businessData) => {
  const res = await api("POST", "/verify-business", businessData);
  //   if (!res.data) {
  //     throw new Error("Failed to verify business");
  //   }
  return res.data;
};

// Hook to verify a business
export const useVerifyBusiness = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyBusiness,
    onSuccess: () => {
      // Invalidate instanceRequests query to refresh the list
      //   queryClient.invalidateQueries(["instanceRequests"]);
    },
    onError: (error) => {
      console.error("Error verify business:", error);
    },
  });
};
