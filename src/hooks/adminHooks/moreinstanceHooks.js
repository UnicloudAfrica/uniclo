import { useQuery } from "@tanstack/react-query";
import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";

// GET: Fetch all instance consoles
const fetchInstanceConsoles = async () => {
  throw new Error("Listing instance consoles is not supported. Fetch by identifier instead.");
};

// GET: Fetch instance request by ID
const fetchInstanceConsoleById = async (id, consoleType = "novnc") => {
  const typeParam = consoleType ? `?type=${encodeURIComponent(consoleType)}` : "";
  const authState = useAdminAuthStore?.getState?.();
  const headers = authState?.getAuthHeaders?.() || {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const response = await fetch(
    `${config.adminURL}/instance-management/${encodeURIComponent(id)}/console${typeParam}`,
    {
      method: "GET",
      headers,
      credentials: "include",
    }
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.error || payload?.message || `Failed to fetch instance console with ID ${id}`
    );
  }

  return payload?.data || payload;
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
  const { consoleType, ...queryOptions } = options;
  return useQuery({
    queryKey: ["instance-console", id, consoleType],
    queryFn: () => fetchInstanceConsoleById(id, consoleType),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};
