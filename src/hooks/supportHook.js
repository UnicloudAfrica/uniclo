import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

// GET: Fetch all support messages
const fetchSupportMessages = async () => {
  const res = await silentApi("GET", "/business/support-message");
  if (!res.data) {
    throw new Error("Failed to fetch support messages");
  }
  return res.data;
};

// GET: Fetch support message by ID
const fetchSupportMessageById = async (id) => {
  const res = await silentApi("GET", `/business/support-message/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch support message with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new support message
const createSupportMessage = async (messageData) => {
  const res = await api("POST", "/business/support-message", messageData);
  if (!res.data) {
    throw new Error("Failed to create support message");
  }
  return res.data;
};

// PATCH: Update a support message
const updateSupportMessage = async ({ id, messageData }) => {
  const res = await api(
    "PATCH",
    `/business/support-message/${id}`,
    messageData
  );
  if (!res.data) {
    throw new Error(`Failed to update support message with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all support messages
export const useFetchSupportMessages = (options = {}) => {
  return useQuery({
    queryKey: ["supportMessages"],
    queryFn: fetchSupportMessages,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch support message by ID
export const useFetchSupportMessageById = (id, options = {}) => {
  return useQuery({
    queryKey: ["supportMessage", id],
    queryFn: () => fetchSupportMessageById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create a support message
export const useCreateSupportMessage = () => {
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

// Hook to update a support message
export const useUpdateSupportMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSupportMessage,
    onSuccess: (data, variables) => {
      // Invalidate both supportMessages list and specific support message query
      queryClient.invalidateQueries(["supportMessages"]);
      queryClient.invalidateQueries(["supportMessage", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating support message:", error);
    },
  });
};
