// src/hooks/adminHooks/adminHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";

type Id = string | number;
type ApiPayload = Record<string, unknown> | FormData | null | undefined;
type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
type QueryOptions = Record<string, unknown>;

// GET: Fetch all admins
const fetchAdmins = async () => {
  const res = await silentApi<ApiResponse>("GET", "/admins");
  if (!res.data) {
    throw new Error("Failed to fetch admins");
  }
  return res.data;
};

// GET: Fetch admin by ID
const fetchAdminById = async (id: Id) => {
  const res = await silentApi<ApiResponse>("GET", `/admins/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch admin with ID ${id}`);
  }
  return res;
};

const createAdmin = async (adminData: ApiPayload) => {
  return await api<ApiResponse>("POST", "/admins", adminData);
};

// PATCH: Update an admin
const updateAdmin = async ({
  id,
  adminData,
}: {
  id: Id;
  adminData: ApiPayload;
  identifier?: Id;
}) => {
  const res = await api<ApiResponse>("PATCH", `/admins/${id}`, adminData);
  if (!res.data) {
    throw new Error(`Failed to update admin with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete an admin
const deleteAdmin = async (id: Id) => {
  const res = await api<ApiResponse>("DELETE", `/admins/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete admin with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all admins
export const useFetchAdmins = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["admins"],
    queryFn: fetchAdmins,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // No retries on failure
    ...options,
  });
};

// Hook to fetch admin by ID
export const useFetchAdminById = (id: Id | null | undefined, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["admins", id],
    queryFn: () => fetchAdminById(id as Id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to create an admin
export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating admin:", error);
    },
  });
};

// Hook to update an admin
export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdmin,
    onSuccess: (_data, variables) => {
      void _data;
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({
        queryKey: ["admins", variables.identifier ?? variables.id],
      });
    },
    onError: (error: unknown) => {
      logger.error("Error updating admin:", error);
    },
  });
};

// Hook to delete an admin
export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting admin:", error);
    },
  });
};
