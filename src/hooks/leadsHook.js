import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

// POST: Create a lead
const createLead = async (leadData) => {
  const res = await api("POST", "/pricing-calculator-leads", leadData);
  if (!res.data) {
    throw new Error("Failed to create lead");
  }
  return res.data;
};

// Hook to create a lead
export const useCreateLeads = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      // Invalidate instanceRequests query to refresh the list
      //   queryClient.invalidateQueries(["instanceRequests"]);
    },
    onError: (error) => {
      console.error("Error creating lead:", error);
    },
  });
};
