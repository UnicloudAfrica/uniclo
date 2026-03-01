import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Id = string | number;
type ApiPayload = Record<string, unknown>;
type QueryParams = Record<string, string | number | boolean | null | undefined>;
type QueryOptions = Record<string, unknown>;
type ApiResponse<T = unknown> = {
  data?: T;
  success?: boolean;
  message?: string;
} & Record<string, unknown>;
type ApiClient = {
  <T = unknown>(method: HttpMethod, uri: string, body?: ApiPayload | null): Promise<T>;
};
type InstanceManagementDetails = {
  instance?: Record<string, unknown>;
  available_actions?: Record<string, unknown>;
} & Record<string, unknown>;
type InstanceManagementActionParams = {
  identifier: Id;
  action: string;
  params?: Record<string, unknown>;
  confirmed?: boolean;
};
type UpdateInstanceRequestPayload = {
  id: Id;
  instanceData: ApiPayload;
};
type UpdateInstanceMetadataPayload = {
  identifier: Id;
  payload: ApiPayload;
};
type InstanceUsageParams = {
  identifier: Id;
  period?: string;
};
type InstanceLogsParams = {
  lines?: number;
  since?: string;
};
type InstanceLogsRequest = {
  identifier: Id;
} & InstanceLogsParams;

const requestAdmin = async <T>(
  client: ApiClient,
  method: HttpMethod,
  uri: string,
  body?: ApiPayload
) => client<ApiResponse<T>>(method, uri, body ?? null);

const requireData = <T>(res: ApiResponse<T>, message: string): T => {
  if (!res.data) {
    throw new Error(message);
  }
  return res.data;
};

const buildQueryString = (params: QueryParams): string => {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null
  );
  if (entries.length === 0) return "";
  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
};

// GET: Fetch all instance requests
const fetchInstanceRequests = async (params: QueryParams = {}) => {
  // Define default parameters, including per_page
  const queryParams: QueryParams = {
    per_page: 10, // Default to 10 items per page
    ...params,
  };

  // Construct the URI with the query string
  const queryString = buildQueryString(queryParams);
  const uri = `/instances${queryString ? `?${queryString}` : ""}`;

  const res = await requestAdmin(silentApi, "GET", uri);
  requireData(res, "Failed to fetch instance requests");
  return res;
};

// GET: Fetch all instance requests
const fetchPurchasedInstances = async (params: QueryParams = {}) => {
  // Define default parameters, including per_page
  const queryParams: QueryParams = {
    per_page: 10, // Default to 10 items per page
    ...params,
  };

  // Construct the URI with the query string
  const queryString = buildQueryString(queryParams);
  const uri = `/instances${queryString ? `?${queryString}` : ""}`;

  const res = await requestAdmin(silentApi, "GET", uri);
  requireData(res, "Failed to fetch instance requests");
  return res;
};

// GET: Fetch instance request by ID
const fetchInstanceRequestById = async (id: Id) => {
  const res = await requestAdmin(silentApi, "GET", `/instances/${id}`);
  return requireData(res, `Failed to fetch instance request with ID ${id}`);
};

const fetchInstanceManagementDetailsByIdentifier = async (identifier: Id) => {
  const res = await requestAdmin<InstanceManagementDetails>(
    silentApi,
    "GET",
    `/instance-management/${identifier}`
  );
  const details = requireData(res, `Failed to fetch instance management details for ${identifier}`);

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
type InstanceLifecyclePayload = {
  status_history?: unknown;
  lifecycle_history?: unknown;
  lifecycle_events?: unknown;
  history?: unknown;
};

const fetchInstanceLifecycleById = async (identifier: Id) => {
  const res = await requestAdmin<InstanceLifecyclePayload>(
    silentApi,
    "GET",
    `/instances/${identifier}`
  );
  const instance = res.data ?? {};
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
const createInstanceRequest = async (instanceData: ApiPayload) => {
  const res = await requestAdmin(api, "POST", "/instances", instanceData);
  return requireData(res, "Failed to create instance request");
};
// POST: multi initiate request
const initiateMultiInstanceRequest = async (instanceData: ApiPayload) => {
  const res = await requestAdmin(api, "POST", "/multi-initiations", instanceData);
  if (!res) {
    throw new Error("Failed to inotiate instance request");
  }
  return res;
};

// PATCH: Update an instance request
const updateInstanceRequest = async ({ id, instanceData }: UpdateInstanceRequestPayload) => {
  const res = await requestAdmin(api, "PATCH", `/instances/${id}`, instanceData);
  return requireData(res, `Failed to update instance request with ID ${id}`);
};

// Hook to fetch all instance requests
export const useFetchInstanceRequests = (params: QueryParams = {}, options: QueryOptions = {}) => {
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
export const useFetchPurchasedInstances = (
  params: QueryParams = {},
  options: QueryOptions = {}
) => {
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
export const useFetchInstanceRequestById = (id: Id, options: QueryOptions = {}) => {
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
export const useFetchInstanceLifeCycleById = (identifier: Id, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["admin-instance-lifecycle", identifier],
    queryFn: () => fetchInstanceLifecycleById(identifier),
    enabled: !!identifier, // Only fetch if identifier is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchInstanceManagementDetails = (identifier: Id, options: QueryOptions = {}) => {
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
}: InstanceManagementActionParams) => {
  if (!identifier || !action) {
    throw new Error("Instance identifier and action are required.");
  }

  const res = await requestAdmin(api, "POST", `/instance-management/${identifier}/actions`, {
    action,
    params,
    ...(confirmed ? { confirmed: true } : {}),
  });

  if (!res.success) {
    throw new Error(res.message || `Failed to execute ${action} action`);
  }

  return res.data ?? res;
};

const refreshInstanceManagementStatus = async (identifier: Id) => {
  if (!identifier) {
    throw new Error("Instance identifier is required to refresh status.");
  }

  const res = await requestAdmin(api, "POST", `/instance-management/${identifier}/refresh-status`);

  if (!res.success) {
    throw new Error(res.message || "Failed to refresh instance status");
  }

  return res.data ?? res;
};

const fetchInstanceUsageStats = async (_params: InstanceUsageParams) => {
  return null;
};

const fetchInstanceLogs = async (_params: InstanceLogsRequest) => {
  return {
    lines: [],
    last_updated: null,
  };
};

const updateInstanceMetadata = async ({ identifier, payload }: UpdateInstanceMetadataPayload) => {
  if (!identifier) {
    throw new Error("Instance identifier is required to update metadata.");
  }

  const res = await requestAdmin(silentApi, "PUT", `/instances/${identifier}`, payload);

  if (!res.success) {
    throw new Error(res.message || `Failed to update metadata for ${identifier}`);
  }

  return res.data ?? res;
};

export const useInstanceManagementAction = () => {
  return useMutation({
    mutationFn: executeInstanceManagementAction,
    onError: (error: unknown) => {
      console.error("Error executing instance management action:", error);
    },
  });
};

export const useRefreshInstanceStatus = () => {
  return useMutation({
    mutationFn: refreshInstanceManagementStatus,
    onError: (error: unknown) => {
      console.error("Error refreshing instance status:", error);
    },
  });
};

export const useInstanceUsageStats = (
  identifier: Id,
  period: string = "24h",
  options: QueryOptions = {}
) => {
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

export const useInstanceLogs = (
  identifier: Id,
  params: InstanceLogsParams = {},
  options: QueryOptions = {}
) => {
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
    onError: (error: unknown) => {
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
      queryClient.invalidateQueries({ queryKey: ["admin-instanceRequests"] });
    },
    onError: (error: unknown) => {
      console.error("Error creating instance request:", error);
    },
  });
};

export const useInitiateMultiInstanceRequest = () => {
  return useMutation({
    mutationFn: initiateMultiInstanceRequest,
    onSuccess: () => {
      // Invalidate instanceRequests query to refresh the list
      // queryClient.invalidateQueries({ queryKey: ["admin-instanceRequests"] });
    },
    onError: (error: unknown) => {
      console.error("Error creating instance request:", error);
    },
  });
};

// Hook to update an instance request
export const useUpdateInstanceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateInstanceRequest,
    onSuccess: (_data, variables: UpdateInstanceRequestPayload) => {
      void _data;
      // Invalidate both instanceRequests list and specific instance request query
      queryClient.invalidateQueries({ queryKey: ["admin-instanceRequests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-instanceRequest", variables.id] });
    },
    onError: (error: unknown) => {
      console.error("Error updating instance request:", error);
    },
  });
};
