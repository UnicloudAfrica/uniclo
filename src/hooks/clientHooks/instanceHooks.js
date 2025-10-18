import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

// GET: Fetch all client instances
const fetchClientInstances = async (params = {}) => {
  // Define default parameters
  const defaultParams = {
    per_page: 10, // Default to 10 items per page
  };

  // Merge provided params with defaults
  const queryParams = { ...defaultParams, ...params };

  // Build query string from parameters
  const queryString = Object.keys(queryParams)
    .filter(
      (key) => queryParams[key] !== undefined && queryParams[key] !== null
    )
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  // Construct the URI with the query string
  const uri = `/business/instances${queryString ? `?${queryString}` : ""}`;

  const res = await clientSilentApi("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch instance requests");
  }
  return res;
};

// GET: Fetch all instance requests
const fetchClientPurchasedInstances = async (params = {}) => {
  // Define default parameters
  const defaultParams = {
    per_page: 10, // Default to 10 items per page
  };

  // Merge provided params with defaults
  const queryParams = { ...defaultParams, ...params };

  // Build query string from parameters
  const queryString = Object.keys(queryParams)
    .filter(
      (key) => queryParams[key] !== undefined && queryParams[key] !== null
    )
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  // Construct the URI with the query string
  const uri = `/business/instances${queryString ? `?${queryString}` : ""}`;

  const res = await clientSilentApi("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch instance requests");
  }
  // Emulate instances behavior by filtering out pending_payment
  const filtered = {
    ...res,
    data: (res.data || []).filter((it) => it.status !== "pending_payment"),
  };
  return filtered;
};

// GET: Fetch client instance by ID
const fetchClientInstanceById = async (id) => {
  const res = await clientSilentApi("GET", `/business/instances/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch instance request with ID ${id}`);
  }
  return res.data;
};

// POST: multi initiate request
const initiateMultiClientInstanceRequest = async (instanceData) => {
  const res = await clientApi(
    "POST",
    "/business/multi-initiations",
    instanceData
  );
  if (!res) {
    throw new Error("Failed to inotiate instance request");
  }
  return res;
};

// PATCH: Update an instance request
const updateClientInstance = async ({ id, instanceData }) => {
  const res = await clientApi(
    "PATCH",
    `/business/instances/${id}`,
    instanceData
  );
  if (!res.data) {
    throw new Error(`Failed to update instance request with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all instance requests
export const useFetchClientInstances = (params = {}, options = {}) => {
  return useQuery({
    // Update queryKey to include params, so different params result in different cached data
    queryKey: ["clientInstances", params],
    // Pass params to the queryFn
    queryFn: () => fetchClientInstances(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch all purchased instance
export const useFetchClientPurchasedInstances = (params = {}, options = {}) => {
  return useQuery({
    // Update queryKey to include params, so different params result in different cached data
    queryKey: ["clientInstances", "purchased", params],
    // Pass params to the queryFn
    queryFn: () => fetchClientPurchasedInstances(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch instance request by ID
export const useFetchClientInstanceById = (id, options = {}) => {
  return useQuery({
    queryKey: ["clientInstance", id],
    queryFn: () => fetchClientInstanceById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useInitiateMultiClientInstanceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: initiateMultiClientInstanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientInstances"] });
    },
    onError: (error) => {
      console.error("Error creating instance request:", error);
    },
  });
};

// Hook to update an instance request
export const useUpdateClientInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientInstance,
    onSuccess: (data, variables) => {
      // Invalidate both instanceRequests list and specific instance request query
      queryClient.invalidateQueries({ queryKey: ["clientInstances"] });
      queryClient.invalidateQueries({
        queryKey: ["clientInstance", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating instance request:", error);
    },
  });
};
