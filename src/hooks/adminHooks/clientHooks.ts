import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import { type Client } from "@/shared/types/client";
import { type ApiResponse } from "@/shared/types/resource";
import logger from "@/utils/logger";

// GET: Fetch all clients
const fetchClients = async (): Promise<Client[]> => {
  const res: ApiResponse<Client[]> = await silentApi("GET", "/clients");
  if (!res.data) {
    throw new Error("Failed to fetch clients");
  }
  return res.data;
};

// GET: Fetch client by ID
const fetchClientById = async (id: string | number): Promise<Client> => {
  const res: ApiResponse<Client> = await silentApi("GET", `/clients/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch client with ID ${id}`);
  }
  return res.data;
};

const createClient = async (clientData: Partial<Client>): Promise<Client | undefined> => {
  try {
    const response: ApiResponse<Client> = await api("POST", "/clients", clientData);
    return response.data;
  } catch (error) {
    logger.error("Error in createClientApiCall:", error);
    throw error;
  }
};

// PATCH: Update a client
const updateClient = async ({
  id,
  clientData,
}: {
  id: string | number;
  clientData: Partial<Client>;
}): Promise<Client> => {
  const res: ApiResponse<Client> = await api("PATCH", `/clients/${id}`, clientData);
  if (!res.data) {
    throw new Error(`Failed to update client with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a client
const deleteClient = async (id: string | number): Promise<unknown> => {
  const res: ApiResponse<unknown> = await api("DELETE", `/clients/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete client with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all clients
export const useFetchClients = (
  options: Omit<UseQueryOptions<Client[]>, "queryKey" | "queryFn"> = {}
) => {
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
export const useFetchClientById = (
  id: string | number,
  options: Omit<UseQueryOptions<Client>, "queryKey" | "queryFn"> = {}
) => {
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
export const useCreateClient = (
  options: Omit<UseMutationOptions<Client | undefined, Error, Partial<Client>>, "mutationFn"> = {}
) => {
  const queryClient = useQueryClient();
  return useMutation<Client | undefined, Error, Partial<Client>>({
    mutationFn: createClient,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      if (options.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
};

// Hook to update a client
export const useUpdateClient = (
  options: Omit<
    UseMutationOptions<Client, Error, { id: string | number; clientData: Partial<Client> }>,
    "mutationFn"
  > = {}
) => {
  const queryClient = useQueryClient();
  return useMutation<Client, Error, { id: string | number; clientData: Partial<Client> }>({
    mutationFn: updateClient,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", String(variables.id)] });
      if (options.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
};

// Hook to delete a client
export const useDeleteClient = (
  options: Omit<UseMutationOptions<unknown, Error, string | number>, "mutationFn"> = {}
) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string | number>({
    mutationFn: deleteClient,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      if (options.onSuccess) {
        (options.onSuccess as any)(data, variables, context);
      }
    },
  });
};
