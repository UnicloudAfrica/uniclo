import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all support messages
const fetchAdminSupportMessages = async () => {
  const res = await silentApi("GET", "/support");
  if (!res.data) {
    throw new Error("Failed to fetch support messages");
  }
  return res.data;
};

// GET: Fetch support message by ID
const fetchAdminSupportMessageById = async (id) => {
  const res = await silentApi("GET", `/support/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch support message with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new support message
const createAdminSupportMessage = async (messageData) => {
  const res = await api("POST", "/support", messageData);
  if (!res.data) {
    throw new Error("Failed to create support message");
  }
  return res.data;
};

// PATCH: Update a support message
const updateAdminSupportMessage = async ({ id, messageData }) => {
  const res = await api("PATCH", `/support/${id}`, messageData);
  if (!res.data) {
    throw new Error(`Failed to update support message with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all support messages
export const useFetchAdminSupportMessages = (options = {}) => {
  return useQuery({
    queryKey: ["adminSupportMessages"],
    queryFn: fetchAdminSupportMessages,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch support message by ID
export const useFetchAdminSupportMessageById = (id, options = {}) => {
  return useQuery({
    queryKey: ["adminSupportMessage", id],
    queryFn: () => fetchAdminSupportMessageById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create a support message
export const useCreateAdminSupportMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminSupportMessage,
    onSuccess: () => {
      // Invalidate supportMessages query to refresh the list
      queryClient.invalidateQueries(["adminSupportMessages"]);
    },
    onError: (error) => {
      console.error("Error creating support message:", error);
    },
  });
};

// Hook to update a support message
export const useUpdateAdminSupportMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminSupportMessage,
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
