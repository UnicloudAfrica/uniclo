// src/hooks/adminHooks/clientHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all clients
const fetchClients = async () => {
  const res = await silentApi("GET", "/clients");
  if (!res.data) {
    throw new Error("Failed to fetch clients");
  }
  return res.data;
};

// GET: Fetch client by ID
const fetchClientById = async (id) => {
  const res = await silentApi("GET", `/clients/${id}`);
  if (!res) {
    throw new Error(`Failed to fetch client with ID ${id}`);
  }
  return res;
};

// POST: Create a new client
// const createClient = async (clientData) => {
//   const res = await api("POST", "/clients", clientData);
//   console.log("Full API Response received in createClient:", res);
//   if (
//     res &&
//     typeof res.status === "number" &&
//     res.status >= 200 &&
//     res.status < 300
//   ) {
//     console.log(`Client creation successful with status: ${res.status}`);
//     return res.data;
//   } else {
//     console.error(
//       `Client creation failed with status ${res?.status || "Unknown"}:`,
//       res
//     );
//     throw new Error("Failed to create client");
//   }
// };

const createClient = async (clientData) => {
  try {
    const response = await api("POST", "/clients", clientData);
    // If silentApi itself throws for 201, then you need to adjust silentApi.
    // If silentApi returns the response object, you might do:
    // if (response.status === 201) {
    //   return response.data; // Or whatever your successful data structure is
    // }
    // return response.data; // Default return if silentApi handles 2xx status codes as success
    return response; // Assuming silentApi returns the parsed data directly for 2xx
  } catch (error) {
    // Re-throw if it's a genuine error (e.g., 4xx, 5xx)
    console.error("Error in createClientApiCall:", error);
    throw error;
  }
};

// PATCH: Update a client
const updateClient = async ({ id, clientData }) => {
  const res = await api("PATCH", `/clients/${id}`, clientData);
  if (!res.data) {
    throw new Error(`Failed to update client with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a client
const deleteClient = async (id) => {
  const res = await api("DELETE", `/clients/${id}`);
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
