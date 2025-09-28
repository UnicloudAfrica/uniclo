import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all instance consoles
const fetchInstanceConsoles = async () => {
  const res = await silentApi("GET", `/instance-consoles`);
  if (!res.data) {
    throw new Error(`Failed to fetch instance consoles`);
  }
  return res.data;
};

// GET: Fetch instance request by ID
const fetchInstanceConsoleById = async (id) => {
  const res = await silentApi("GET", `/instance-consoles/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch instance console with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all instance consoles
export const useFetchInstanceConsoles = (options = {}) => {
  return useQuery({
    queryKey: ["instance-consoles"],
    queryFn: fetchInstanceConsoles,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch instance console by ID
export const useFetchInstanceConsoleById = (id, options = {}) => {
  return useQuery({
    queryKey: ["instance-console", id],
    queryFn: () => fetchInstanceConsoleById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
