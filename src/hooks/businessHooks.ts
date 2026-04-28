import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import api from "../index/api";
import logger from "../utils/logger";

// POST: verify a business
const verifyBusiness = async (businessData: Record<string, unknown>): Promise<unknown> => {
  const res = await api<{ data?: unknown }>("POST", "/business-verifications", businessData);
  return res.data;
};

// Hook to verify a business
export const useVerifyBusiness = (): UseMutationResult<unknown, Error, unknown> => {
  const _queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyBusiness,
    onSuccess: () => {
      // Invalidate instanceRequests query to refresh the list
      // queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
    },
    onError: (error) => {
      logger.error("Error verify business:", error);
    },
  });
};
