import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";

// POST: Create a new quote
const createTenantQuote = async (userData) => {
  const res = await silentTenantApi("POST", "/admin/quote", userData);
  if (!res) {
    throw new Error("Failed to create quote");
  }
  return res.message;
};

export const useCreateTenantQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantQuote,
    onSuccess: () => {
      // Invalidate Quotes query to refresh the list
      //   queryClient.invalidateQueries(["Quotes"]);
    },
    onError: (error) => {
      console.error("Error creating Quote", error);
    },
  });
};
