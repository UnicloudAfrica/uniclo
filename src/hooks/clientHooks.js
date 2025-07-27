// src/hooks/adminHooks/clientHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";

// GET: Fetch all clients
const fetchClients = async () => {
  const res = await silentTenantApi("GET", "/admin/clients");
  if (!res.data) {
    throw new Error("Failed to fetch clients");
  }
  return res.data;
};

// GET: Fetch client by ID
const fetchClientById = async (id) => {
  const res = await silentTenantApi("GET", `/admin/clients/${id}`);
  if (!res) {
    throw new Error(`Failed to fetch client with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new client
const createClient = async (clientData) => {
  try {
    const response = await tenantApi("POST", "/admin/clients", clientData);

    return response;
  } catch (error) {
    console.error("Error in createClientApiCall:", error);
    throw error;
  }
};

// PATCH: Update a client
const updateClient = async ({ id, clientData }) => {
  const res = await tenantApi("PATCH", `/admin/clients/${id}`, clientData);
  if (!res.data) {
    throw new Error(`Failed to update client with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a client
const deleteClient = async (id) => {
  const res = await tenantApi("DELETE", `/admin/clients/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete client with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all clients
export const useFetchClients = (options = {}) => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // No retries on failure
    ...options,
  });
};

// Hook to fetch client by ID
export const useFetchClientById = (id, options = {}) => {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => fetchClientById(id),
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
      console.log("Client created successfully");
      queryClient.invalidateQueries(["clients"]);
    },
    onError: (error) => {
      console.error("Error creating client:", error);
    },
  });
};

// Hook to update a client
export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClient,
    onSuccess: (data, variables) => {
      console.log("Client updated successfully");
      queryClient.invalidateQueries(["clients"]);
      queryClient.invalidateQueries(["clients", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating client:", error);
    },
  });
};

// Hook to delete a client
export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      console.log("Client deleted successfully");
      queryClient.invalidateQueries(["clients"]);
    },
    onError: (error) => {
      console.error("Error deleting client:", error);
    },
  });
};
