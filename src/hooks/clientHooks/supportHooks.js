import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

// POST: Create a new support message
const createSupportMessage = async (messageData) => {
  const res = await clientApi("POST", "/business/support", messageData);
  if (!res.data) {
    throw new Error("Failed to create support message");
  }
  return res.data;
};

// Hook to create a support message
export const useCreateClientSupportMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSupportMessage,
    onSuccess: () => {
      // Invalidate supportMessages query to refresh the list
      queryClient.invalidateQueries(["supportMessages"]);
    },
    onError: (error) => {
      console.error("Error creating support message:", error);
    },
  });
};
