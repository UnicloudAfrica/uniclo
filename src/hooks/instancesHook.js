import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../index/silent";
import api from "../index/api";
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
  const uri = `/business/instances${queryString ? `?${queryString}` : ""}`;

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
    .filter(
      (key) => queryParams[key] !== undefined && queryParams[key] !== null
    )
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&");

  // Construct the URI with the query string
  const uri = `/business/instances${queryString ? `?${queryString}` : ""}`;

  const res = await silentApi("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch instance requests");
  }
  // Emulate instances behavior by filtering out pending_payment
  const filtered = { ...res, data: (res.data || []).filter((it) => it.status !== "pending_payment") };
  return filtered;
};

// GET: Fetch instance request by ID
const fetchInstanceRequestById = async (id) => {
  const res = await silentApi("GET", `/business/instances/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch instance request with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new instance request
const createInstanceRequest = async (instanceData) => {
  const res = await api("POST", "/business/instances", instanceData);
  if (!res.data) {
    throw new Error("Failed to create instance request");
  }
  return res.data;
};

// POST: multi initiate request with enhanced response handling
const initiateMultiInstanceRequest = async (instanceData) => {
  const res = await api("POST", "/business/instances/create", instanceData);
  if (!res) {
    throw new Error("Failed to initiate instance request");
  }
  return res;
};

// POST: Refresh instance status from provider
const refreshInstanceStatus = async (identifier) => {
  const res = await api("POST", `/business/instance-management/${identifier}/refresh-status`);
  if (!res.success) {
    throw new Error(res.message || "Failed to refresh instance status");
  }
  return res.data;
};

// GET: Get detailed instance information
const getInstanceDetails = async (identifier) => {
  const res = await api("GET", `/business/instance-management/${identifier}`);
  if (!res.success) {
    throw new Error(res.message || "Failed to get instance details");
  }
  return res.data;
};

// POST: Execute instance action (start, stop, reboot, etc.)
const executeInstanceAction = async (identifier, action, params = {}) => {
  const res = await api("POST", `/business/instance-management/${identifier}/actions`, {
    action,
    params,
    confirmed: params.confirmed || false,
  });
  if (!res.success) {
    throw new Error(res.message || `Failed to execute ${action} action`);
  }
  return res.data;
};

// GET: Get transaction status
const getTransactionStatus = async (transactionId) => {
  const res = await silentApi("GET", `/business/transactions/${transactionId}/status`);
  if (!res.success) {
    throw new Error(res.message || "Failed to get transaction status");
  }
  return res.data;
};

// GET: Get transaction details with instances
const getTransactionDetails = async (transactionId) => {
  const res = await silentApi("GET", `/business/transactions/${transactionId}`);
  if (!res.success) {
    throw new Error(res.message || "Failed to get transaction details");
  }
  return res.data;
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

// Hook to refresh instance status
export const useRefreshInstanceStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshInstanceStatus,
    onSuccess: (data, identifier) => {
      // Invalidate instance queries to refresh the data
      queryClient.invalidateQueries(["instanceRequests"]);
      queryClient.invalidateQueries(["instanceRequest", identifier]);
      queryClient.invalidateQueries(["instanceDetails", identifier]);
    },
    onError: (error) => {
      console.error("Error refreshing instance status:", error);
    },
  });
};

// Hook to get detailed instance information
export const useGetInstanceDetails = (identifier, options = {}) => {
  return useQuery({
    queryKey: ["instanceDetails", identifier],
    queryFn: () => getInstanceDetails(identifier),
    enabled: !!identifier,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to execute instance actions
export const useExecuteInstanceAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ identifier, action, params }) => 
      executeInstanceAction(identifier, action, params),
    onSuccess: (data, { identifier }) => {
      // Invalidate queries to refresh instance data
      queryClient.invalidateQueries(["instanceRequests"]);
      queryClient.invalidateQueries(["instanceRequest", identifier]);
      queryClient.invalidateQueries(["instanceDetails", identifier]);
    },
    onError: (error) => {
      console.error("Error executing instance action:", error);
    },
  });
};

// Hook to get transaction status
export const useGetTransactionStatus = (transactionId, options = {}) => {
  return useQuery({
    queryKey: ["transactionStatus", transactionId],
    queryFn: () => getTransactionStatus(transactionId),
    enabled: !!transactionId,
    staleTime: 1000 * 30, // Cache for 30 seconds
    refetchInterval: options.autoRefresh ? 30000 : false, // Auto-refresh every 30s if enabled
    refetchOnWindowFocus: true,
    ...options,
  });
};

// Hook to get transaction details
export const useGetTransactionDetails = (transactionId, options = {}) => {
  return useQuery({
    queryKey: ["transactionDetails", transactionId],
    queryFn: () => getTransactionDetails(transactionId),
    enabled: !!transactionId,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to poll transaction status until completion
export const useTransactionPolling = (transactionId, onComplete) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ["transactionPolling", transactionId],
    queryFn: () => getTransactionStatus(transactionId),
    enabled: !!transactionId,
    refetchInterval: (data) => {
      // Stop polling if transaction is completed, failed, or cancelled
      if (data?.status && ['successful', 'failed', 'cancelled', 'expired'].includes(data.status)) {
        if (data.status === 'successful' && onComplete) {
          onComplete(data);
        }
        return false;
      }
      return 30000; // Poll every 30 seconds
    },
    onSuccess: (data) => {
      if (data?.status === 'successful') {
        // Invalidate related queries when payment is successful
        queryClient.invalidateQueries(["instanceRequests"]);
        queryClient.invalidateQueries(["transactionDetails", transactionId]);
      }
    },
    onError: (error) => {
      console.error("Error polling transaction status:", error);
    },
  });
};
