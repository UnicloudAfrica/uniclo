import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";

// GET: Fetch all instance requests
const fetchInstanceRequests = async (params = {}) => {
  // Define default parameters, including per_page
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
  const uri = `/admin/instances${queryString ? `?${queryString}` : ""}`;

  const res = await silentTenantApi("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch instance requests");
  }
  return res;
};

// GET: Fetch all instance requests
const fetchPurchasedInstances = async (params = {}) => {
  // Define default parameters, including per_page
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
  const uri = `/admin/purchased-instances${
    queryString ? `?${queryString}` : ""
  }`;

  const res = await silentTenantApi("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch instance requests");
  }
  return res;
};

// GET: Fetch instance request by ID
const fetchInstanceRequestById = async (id) => {
  const res = await silentTenantApi("GET", `/admin/instances/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch instance request with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new instance request
const createInstanceRequest = async (instanceData) => {
  const res = await tenantApi("POST", "/admin/instances", instanceData);
  if (!res.data) {
    throw new Error("Failed to create instance request");
  }
  return res.data;
};

// POST: multi initiate request
const initiateMultiInstanceRequest = async (instanceData) => {
  const res = await tenantApi("POST", "/admin/multi-initiations", instanceData);
  if (!res) {
    throw new Error("Failed to inotiate instance request");
  }
  return res;
};

// PATCH: Update an instance request
const updateInstanceRequest = async ({ id, instanceData }) => {
  const res = await tenantApi("PATCH", `/admin/instances/${id}`, instanceData);
  if (!res.data) {
    throw new Error(`Failed to update instance request with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all instance requests
export const useFetchInstanceRequests = (params = {}, options = {}) => {
  return useQuery({
    // Update queryKey to include params, so different params result in different cached data
    queryKey: ["instanceRequests", params],
    // Pass params to the queryFn
    queryFn: () => fetchInstanceRequests(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch all purchased instance
export const useFetchPurchasedInstances = (params = {}, options = {}) => {
  return useQuery({
    // Update queryKey to include params, so different params result in different cached data
    queryKey: ["instanceRequests", params],
    // Pass params to the queryFn
    queryFn: () => fetchPurchasedInstances(params),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch instance request by ID
export const useFetchInstanceRequestById = (id, options = {}) => {
  return useQuery({
    queryKey: ["instanceRequest", id],
    queryFn: () => fetchInstanceRequestById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create an instance request
export const useCreateInstanceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInstanceRequest,
    onSuccess: () => {
      // Invalidate instanceRequests query to refresh the list
      //   queryClient.invalidateQueries(["instanceRequests"]);
    },
    onError: (error) => {
      console.error("Error creating instance request:", error);
    },
  });
};

export const useInitiateMultiInstanceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: initiateMultiInstanceRequest,
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
    },
    onError: (error) => {
      console.error("Error creating instance request:", error);
    },
  });
};

// Hook to update an instance request
export const useUpdateInstanceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateInstanceRequest,
    onSuccess: (data, variables) => {
      // Invalidate both instanceRequests list and specific instance request query
      queryClient.invalidateQueries(["instanceRequests"]);
      queryClient.invalidateQueries(["instanceRequest", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating instance request:", error);
    },
  });
};
