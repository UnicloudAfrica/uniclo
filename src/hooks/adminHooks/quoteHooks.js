import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// POST: Create a new quote
const createQuote = async (userData) => {
  const res = await silentApi("POST", "/quote", userData);
  if (!res) {
    throw new Error("Failed to create quote");
  }
  return res.message;
};

export const useCreateQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuote,
    onSuccess: () => {
      // Invalidate Quotes query to refresh the list
      //   queryClient.invalidateQueries(["Quotes"]);
    },
    onError: (error) => {
      console.error("Error creating Quote", error);
    },
  });
};
