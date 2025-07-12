import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all customers
const fetchCustomers = async () => {
  const res = await silentApi("GET", "/customer");
  if (!res.data) {
    throw new Error("Failed to fetch customers");
  }
  // Format any monetary fields in the response (if applicable)
  return res.data;
};

// GET: Fetch customer by ID
const fetchCustomerById = async (id) => {
  const res = await silentApi("GET", `/customer/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch customer with ID ${id}`);
  }

  return res.data;
};

// POST: Create a new customer
const createCustomer = async (customerData) => {
  const res = await api("POST", "/customer", customerData);
  if (!res.data) {
    throw new Error("Failed to create customer");
  }
  return res.data;
};

// PATCH: Update a customer
const updateCustomer = async ({ id, customerData }) => {
  const res = await api("PATCH", `/customer/${id}`, customerData);
  if (!res.data) {
    throw new Error(`Failed to update customer with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a customer
const deleteCustomer = async (id) => {
  const res = await api("DELETE", `/customer/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete customer with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all customers
export const useFetchCustomers = (options = {}) => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch customer by ID
export const useFetchCustomerById = (id, options = {}) => {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomerById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create a customer
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      // Invalidate customers query to refresh the list
      queryClient.invalidateQueries(["customers"]);
    },
    onError: (error) => {
      console.error("Error creating customer:", error);
    },
  });
};

// Hook to update a customer
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCustomer,
    onSuccess: (data, variables) => {
      // Invalidate both customers list and specific customer query
      queryClient.invalidateQueries(["customers"]);
      queryClient.invalidateQueries(["customer", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating customer:", error);
    },
  });
};

// Hook to delete a customer
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      // Invalidate customers query to refresh the list
      queryClient.invalidateQueries(["customers"]);
    },
    onError: (error) => {
      console.error("Error deleting customer:", error);
    },
  });
};
