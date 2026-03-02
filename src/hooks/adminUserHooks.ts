// src/hooks/adminHooks/adminHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";
import logger from "../utils/logger";

type TenantAdminId = string | number;
type TenantAdminPayload = Record<string, unknown>;

type UpdateTenantAdminInput = {
  id: TenantAdminId;
  adminData: TenantAdminPayload;
};

// GET: Fetch all admins
const fetchTenantAdmins = async () => {
  const res = await silentTenantApi("GET", "/admin/admins");
  if (!res.data) {
    throw new Error("Failed to fetch admins");
  }
  return res.data;
};

// GET: Fetch admin by ID
const fetchTenantAdminById = async (id: TenantAdminId) => {
  const res = await silentTenantApi("GET", `/admin/admins/${id}`);
  if (!res) {
    throw new Error(`Failed to fetch admin with ID ${id}`);
  }
  return res;
};

const createTenantAdmin = async (adminData: TenantAdminPayload) => {
  return await tenantApi("POST", "/admin/admins", adminData);
};

// PATCH: Update an admin
const updateTenantAdmin = async ({ id, adminData }: UpdateTenantAdminInput) => {
  const res = await tenantApi("PATCH", `/admin/admins/${id}`, adminData);
  if (!res.data) {
    throw new Error(`Failed to update admin with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete an admin
const deleteTenantAdmin = async (id: TenantAdminId) => {
  const res = await tenantApi("DELETE", `/admin/admins/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete admin with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all admins
export const useFetchTenantAdmins = (options: any = {}) => {
  return useQuery({
    queryKey: ["tenant-admins"],
    queryFn: fetchTenantAdmins,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // No retries on failure
    ...options,
  });
};

// Hook to fetch admin by ID
export const useFetchTenantAdminById = (id: TenantAdminId, options: any = {}) => {
  return useQuery({
    queryKey: ["tenant-admins", id],
    queryFn: () => fetchTenantAdminById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to create an admin
export const useCreateTenantAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-admins"] });
    },
    onError: (error) => {
      logger.error("Error creating admin:", error);
    },
  });
};

// Hook to update an admin
export const useUpdateTenantAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantAdmin,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-admins"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-admins", variables.id] });
    },
    onError: (error) => {
      logger.error("Error updating admin:", error);
    },
  });
};

// Hook to delete an admin
export const useDeleteTenantAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenantAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-admins"] });
    },
    onError: (error) => {
      logger.error("Error deleting admin:", error);
    },
  });
};
