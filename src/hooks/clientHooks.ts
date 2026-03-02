// src/hooks/adminHooks/clientHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";
import logger from "../utils/logger";

// GET: Fetch all clients
const fetchClients = async ({ queryKey }: { queryKey: any[] }) => {
  const [, params] = queryKey;
  const tenantId = params?.tenantId;
  const query = tenantId ? `?tenant_id=${tenantId}` : "";
  const res = await silentTenantApi("GET", `/admin/clients${query}`);
  if (!res.data) {
    throw new Error("Failed to fetch clients");
  }
  return res.data;
};

// GET: Fetch client by ID
const fetchClientById = async ({ queryKey }: { queryKey: any[] }) => {
  const [, id] = queryKey;
  const res = await silentTenantApi("GET", `/admin/clients/${id}`);
  if (!res) {
    throw new Error(`Failed to fetch client with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new client
const createClient = async (clientData: any) => {
  try {
    const response = await tenantApi("POST", "/admin/clients", clientData);

    return response;
  } catch (error) {
    logger.error("Error in createClientApiCall:", error);
    throw error;
  }
};

// PATCH: Update a client
const updateClient = async ({ id, clientData }: { id: any; clientData: any }) => {
  const res = await tenantApi("PATCH", `/admin/clients/${id}`, clientData);
  if (!res.data) {
    throw new Error(`Failed to update client with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a client
const deleteClient = async (id: any) => {
  const res = await tenantApi("DELETE", `/admin/clients/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete client with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all clients
export const useFetchClients = (tenantId: any = null, options: any = {}) => {
  return useQuery({
    queryKey: ["clients", { tenantId }],
    queryFn: fetchClients,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // No retries on failure
    ...options,
  });
};

// Hook to fetch client by ID
export const useFetchClientById = (id: any, options: any = {}) => {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: fetchClientById,
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to create a client
export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      logger.log("Client created successfully");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => {
      logger.error("Error creating client:", error);
    },
  });
};

// Hook to update a client
export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClient,
    onSuccess: (data, variables) => {
      logger.log("Client updated successfully");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", variables.id] });
    },
    onError: (error) => {
      logger.error("Error updating client:", error);
    },
  });
};

// Hook to delete a client
export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      logger.log("Client deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => {
      logger.error("Error deleting client:", error);
    },
  });
};
