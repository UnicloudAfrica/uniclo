// src/hooks/adminHooks/adminHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all admins
const fetchAdmins = async () => {
  const res = await silentApi("GET", "/admin");
  if (!res.data) {
    throw new Error("Failed to fetch admins");
  }
  return res.data;
};

// GET: Fetch admin by ID
const fetchAdminById = async (id) => {
  const res = await silentApi("GET", `/admin/${id}`);
  if (!res) {
    throw new Error(`Failed to fetch admin with ID ${id}`);
  }
  return res;
};

// POST: Create a new admin
// const createAdmin = async (adminData) => {
//   const res = await api("POST", "/admin", adminData);
//   console.log("Full API Response received in createAdmin:", res);
//   if (
//     res &&
//     typeof res.status === "number" &&
//     res.status >= 200 &&
//     res.status < 300
//   ) {
//     // console.log(`Admin creation successful with status: ${res.status}`);
//     return res.data;
//   } else {
//     console.error(
//       `Admin creation failed with status ${res?.status || "Unknown"}:`,
//       res
//     );
//     throw new Error("Failed to create admin");
//   }
// };

const createAdmin = async (adminData) => {
  return await api("POST", "/admin", adminData);
};

// PATCH: Update an admin
const updateAdmin = async ({ id, adminData }) => {
  const res = await api("PATCH", `/admin/${id}`, adminData);
  if (!res.data) {
    throw new Error(`Failed to update admin with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete an admin
const deleteAdmin = async (id) => {
  const res = await api("DELETE", `/admin/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete admin with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all admins
export const useFetchAdmins = (options = {}) => {
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
export const useFetchAdminById = (id, options = {}) => {
  return useQuery({
    queryKey: ["admins", id],
    queryFn: () => fetchAdminById(id),
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
      queryClient.invalidateQueries(["admins"]);
    },
    onError: (error) => {
      console.error("Error creating admin:", error);
    },
  });
};

// Hook to update an admin
export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdmin,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["admins"]);
      queryClient.invalidateQueries(["admins", variables.identifier]);
    },
    onError: (error) => {
      console.error("Error updating admin:", error);
    },
  });
};

// Hook to delete an admin
export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries(["admins"]);
    },
    onError: (error) => {
      console.error("Error deleting admin:", error);
    },
  });
};
