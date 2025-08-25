// src/hooks/useTenants.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all tenants
const fetchTenants = async () => {
  const res = await silentApi("GET", "/tenants");
  if (!res.data) {
    throw new Error("Failed to fetch tenants");
  }
  return res.data;
};

// GET: Fetch tenant by ID
const fetchTenantById = async (id) => {
  const res = await silentApi("GET", `/tenants/${id}`);
  if (!res) {
    throw new Error(`Failed to fetch tenant with ID ${id}`);
  }
  return res;
};

// GET: Fetch tenant's subtenants
const fetchSubTenantByTenantID = async (id) => {
  const res = await silentApi("GET", `/tenant-clients/${id}`);
  if (!res) {
    throw new Error(`Failed to fetch tenant with ID ${id}`);
  }
  return res.message;
};

// POST: Create a new tenant
const createTenant = async (tenantData) => {
  // Make the API call using your existing 'api' utility
  const res = await api("POST", "/tenants", tenantData);
  console.log("Full API Response received in createTenant:", res);
  if (
    res &&
    typeof res.status === "number" &&
    res.status >= 200 &&
    res.status < 300
  ) {
    console.log(`Tenant creation successful with status: ${res.status}`);

    return res.data;
  } else {
    console.error(
      `Tenant creation failed with status ${res?.status || "Unknown"}:`,
      res
    );
  }
};

// PATCH: Update a tenant
const updateTenant = async ({ id, tenantData }) => {
  const res = await api("PATCH", `/tenants/${id}`, tenantData);
  if (!res) {
    throw new Error(`Failed to update tenant with ID ${id}`);
  }
  return res;
};

// DELETE: Delete a tenant
const deleteTenant = async (id) => {
  const res = await api("DELETE", `/tenants/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete tenant with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all tenants
export const useFetchTenants = (options = {}) => {
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
export const useFetchTenantById = (id, options = {}) => {
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
export const useFetchSubTenantByTenantID = (id, options = {}) => {
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
export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries(["tenants"]);
    },
    onError: (error) => {
      console.error("Error creating tenant:", error);
    },
  });
};

// Hook to update a tenant
export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenant,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["tenants"]);
      queryClient.invalidateQueries(["tenants", variables.identifier]);
    },
    onError: (error) => {
      console.error("Error updating tenant:", error);
    },
  });
};

// Hook to delete a tenant
export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries(["tenants"]);
    },
    onError: (error) => {
      console.error("Error deleting tenant:", error);
    },
  });
};
