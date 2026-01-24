import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

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
    .filter((key) => queryParams[key] !== undefined && queryParams[key] !== null)
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  // Construct the URI with the query string
  const uri = `/instances${queryString ? `?${queryString}` : ""}`;

  const res = await silentApi("GET", uri);
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
    .filter((key) => queryParams[key] !== undefined && queryParams[key] !== null)
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  // Construct the URI with the query string
  const uri = `/instances${queryString ? `?${queryString}` : ""}`;

  const res = await silentApi("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch instance requests");
  }
  return res;
};

// GET: Fetch instance request by ID
const fetchInstanceRequestById = async (id) => {
  const res = await silentApi("GET", `/instances/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch instance request with ID ${id}`);
  }
  return res.data;
};

const fetchInstanceManagementDetailsByIdentifier = async (identifier) => {
  const res = await silentApi("GET", `/instance-management/${identifier}`);
  const details = res?.data;

  if (!details?.instance) {
    throw new Error(`Failed to fetch instance management details for ${identifier}`);
  }

  return {
    ...details,
    supports_instance_actions: Boolean(
      details.available_actions && Object.keys(details.available_actions).length
    ),
  };
};

// GET: Fetch instance lifecycle by ID
const fetchInstanceLifecycleById = async (identifier) => {
  const res = await silentApi("GET", `/instances/${identifier}`);
  const instance = res?.data || {};
  const candidateHistory =
    instance.status_history ||
    instance.lifecycle_history ||
    instance.lifecycle_events ||
    instance.history ||
    [];

  return {
    events: Array.isArray(candidateHistory) ? candidateHistory : [],
  };
};

// POST: Create a new instance request
const createInstanceRequest = async (instanceData) => {
  const res = await api("POST", "/instances", instanceData);
  if (!res.data) {
    throw new Error("Failed to create instance request");
  }
  return res.data;
};
// POST: multi initiate request
const initiateMultiInstanceRequest = async (instanceData) => {
  const res = await api("POST", "/multi-initiations", instanceData);
  if (!res) {
    throw new Error("Failed to inotiate instance request");
  }
  return res;
};

// PATCH: Update an instance request
const updateInstanceRequest = async ({ id, instanceData }) => {
  const res = await api("PATCH", `/instances/${id}`, instanceData);
  if (!res.data) {
    throw new Error(`Failed to update instance request with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all instance requests
export const useFetchInstanceRequests = (params = {}, options = {}) => {
  return useQuery({
    // Update queryKey to include params, so different params result in different cached data
    queryKey: ["admin-instanceRequests", params],
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
    queryKey: ["admin-instanceRequests", params],
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
    queryKey: ["admin-instanceRequest", id],
    queryFn: () => fetchInstanceRequestById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
// Hook to fetch instance request by ID
export const useFetchInstanceLifeCycleById = (identifier, options = {}) => {
  return useQuery({
    queryKey: ["admin-instance-lifecycle", identifier],
    queryFn: () => fetchInstanceLifecycleById(identifier),
    enabled: !!identifier, // Only fetch if identifier is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchInstanceManagementDetails = (identifier, options = {}) => {
  return useQuery({
    queryKey: ["admin-instanceManagement", identifier],
    queryFn: () => fetchInstanceManagementDetailsByIdentifier(identifier),
    enabled: !!identifier,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

const executeInstanceManagementAction = async ({
  identifier,
  action,
  params = {},
  confirmed = false,
}) => {
  if (!identifier || !action) {
    throw new Error("Instance identifier and action are required.");
  }

  const payload = {
    action,
    params,
  };

  if (confirmed) {
    payload.confirmed = true;
  }

  const res = await api("POST", `/instance-management/${identifier}/actions`, payload);

  if (!res?.success) {
    throw new Error(res?.message || `Failed to execute ${action} action`);
  }

  return res.data ?? res;
};

const refreshInstanceManagementStatus = async (identifier) => {
  if (!identifier) {
    throw new Error("Instance identifier is required to refresh status.");
  }

  const res = await api("POST", `/instance-management/${identifier}/refresh-status`);

  if (!res?.success) {
    throw new Error(res?.message || "Failed to refresh instance status");
  }

  return res.data ?? res;
};

const fetchInstanceUsageStats = async ({ identifier, period = "24h" }) => {
  return null;
};

const fetchInstanceLogs = async ({ identifier, lines = 200, since }) => {
  return {
    lines: [],
    last_updated: null,
  };
};

const updateInstanceMetadata = async ({ identifier, payload }) => {
  if (!identifier) {
    throw new Error("Instance identifier is required to update metadata.");
  }

  const res = await silentApi("PUT", `/instances/${identifier}`, payload);

  if (!res?.success) {
    throw new Error(res?.message || `Failed to update metadata for ${identifier}`);
  }

  return res.data ?? res;
};

export const useInstanceManagementAction = () => {
  return useMutation({
    mutationFn: executeInstanceManagementAction,
    onError: (error) => {
      console.error("Error executing instance management action:", error);
    },
  });
};

export const useRefreshInstanceStatus = () => {
  return useMutation({
    mutationFn: refreshInstanceManagementStatus,
    onError: (error) => {
      console.error("Error refreshing instance status:", error);
    },
  });
};

export const useInstanceUsageStats = (identifier, period = "24h", options = {}) => {
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: ["admin-instance-usage", identifier, period],
    queryFn: () => fetchInstanceUsageStats({ identifier, period }),
    enabled: !!identifier && enabled,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

export const useInstanceLogs = (identifier, params = {}, options = {}) => {
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: ["admin-instance-logs", identifier, params.lines, params.since],
    queryFn: () =>
      fetchInstanceLogs({
        identifier,
        lines: params.lines,
        since: params.since,
      }),
    enabled: !!identifier && enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

export const useUpdateInstanceMetadata = () => {
  return useMutation({
    mutationFn: updateInstanceMetadata,
    onError: (error) => {
      console.error("Error updating instance metadata:", error);
    },
  });
};

// Hook to create an instance request
export const useCreateInstanceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInstanceRequest,
    onSuccess: () => {
      // Invalidate instanceRequests query to refresh the list
      queryClient.invalidateQueries(["admin-instanceRequests"]);
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
      // Invalidate instanceRequests query to refresh the list
      // queryClient.invalidateQueries(["admin-instanceRequests"]);
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
      queryClient.invalidateQueries(["admin-instanceRequests"]);
      queryClient.invalidateQueries(["admin-instanceRequest", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating instance request:", error);
    },
  });
};
