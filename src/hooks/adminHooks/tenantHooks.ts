import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import { type Tenant } from "../../shared/types/tenant";
import { type ApiResponse } from "../../shared/types/resource";
import logger from "../../utils/logger";

// GET: Fetch all tenants
const fetchTenants = async (): Promise<Tenant[]> => {
  const res: ApiResponse<Tenant[]> = await silentApi("GET", "/tenants");
  if (!res.data) {
    throw new Error("Failed to fetch tenants");
  }
  return res.data;
};

// GET: Fetch tenant by ID
const fetchTenantById = async (id: string | number): Promise<Tenant> => {
  const res: ApiResponse<Tenant> = await silentApi("GET", `/tenants/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch tenant with ID ${id}`);
  }
  return res.data;
};

// GET: Fetch tenant's subtenants
const fetchSubTenantByTenantID = async (id: string | number): Promise<string | undefined> => {
  const res: ApiResponse<unknown> & { message?: string | { message?: string } } = await silentApi(
    "GET",
    `/tenant-clients/${id}`
  );
  if (!res) {
    throw new Error(`Failed to fetch tenant with ID ${id}`);
  }
  if (typeof res.message === "string") return res.message;
  return (res.message as { message?: string })?.message;
};

// POST: Create a new tenant
const createTenant = async (tenantData: Partial<Tenant>): Promise<Tenant | undefined> => {
  // Make the API call using your existing 'api' utility
  const res: ApiResponse<Tenant> & { status?: number } = await api("POST", "/tenants", tenantData);
  if (res && typeof res.status === "number" && res.status >= 200 && res.status < 300) {
    return res.data;
  } else {
    logger.error(`Tenant creation failed with status ${res?.status || "Unknown"}:`, res);
  }
  return undefined;
};

// PATCH: Update a tenant
const updateTenant = async ({
  id,
  tenantData,
}: {
  id: string | number;
  tenantData: Partial<Tenant>;
}): Promise<Tenant> => {
  const res: ApiResponse<Tenant> = await api("PATCH", `/tenants/${id}`, tenantData);
  if (!res.data) {
    throw new Error(`Failed to update tenant with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a tenant
const deleteTenant = async (id: string | number): Promise<unknown> => {
  const res: ApiResponse<unknown> = await api("DELETE", `/tenants/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete tenant with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all tenants
export const useFetchTenants = (
  options: Omit<UseQueryOptions<Tenant[]>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["tenants"],
    queryFn: fetchTenants,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // No retries on failure
    ...options,
  });
};

// Hook to fetch tenant by ID
export const useFetchTenantById = (
  id: string | number,
  options: Omit<UseQueryOptions<Tenant>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["tenants", id],
    queryFn: () => fetchTenantById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to fetch sub tenant by ID
export const useFetchSubTenantByTenantID = (
  id: string | number,
  options: Omit<UseQueryOptions<string | undefined>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["sub-tenants", id],
    queryFn: () => fetchSubTenantByTenantID(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to create a tenant
export const useCreateTenant = (
  options: Omit<UseMutationOptions<Tenant | undefined, Error, Partial<Tenant>>, "mutationFn"> = {}
) => {
  const queryClient = useQueryClient();
  return useMutation<Tenant | undefined, Error, Partial<Tenant>>({
    mutationFn: createTenant,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      if (options.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
};

// Hook to update a tenant
export const useUpdateTenant = (
  options: Omit<
    UseMutationOptions<Tenant, Error, { id: string | number; tenantData: Partial<Tenant> }>,
    "mutationFn"
  > = {}
) => {
  const queryClient = useQueryClient();
  return useMutation<Tenant, Error, { id: string | number; tenantData: Partial<Tenant> }>({
    mutationFn: updateTenant,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenants", String(variables.id)] });
      if (options.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
};

// Hook to delete a tenant
export const useDeleteTenant = (
  options: Omit<UseMutationOptions<unknown, Error, string | number>, "mutationFn"> = {}
) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string | number>({
    mutationFn: deleteTenant,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      if (options.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
};
