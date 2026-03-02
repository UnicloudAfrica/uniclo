import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import silentApi from "../index/silent";
import api from "../index/api";
import tenantApi from "../index/tenant/tenantApi";
import logger from "../utils/logger";

type Identifier = string | number;
type QueryParamValue = string | number | boolean | null | undefined;

type QueryOptions<TData> = Omit<UseQueryOptions<TData, Error>, "queryKey" | "queryFn">;

interface InstanceQueryParams {
  [key: string]: QueryParamValue;
  per_page?: number;
}

interface InstanceRecord {
  id?: Identifier;
  status?: string;
  [key: string]: unknown;
}

interface TransactionStatusResponse {
  status?: string;
  [key: string]: unknown;
}

interface ApiResponseMessage {
  message?: string;
}

type ApiMessage = string | ApiResponseMessage | undefined;

interface ApiEnvelope<TData = unknown> {
  data?: TData;
  success?: boolean;
  message?: ApiMessage;
  [key: string]: unknown;
}

interface InstanceActionParams {
  confirmed?: boolean;
  [key: string]: unknown;
}

interface ExecuteActionPayload {
  identifier: Identifier;
  action: string;
  params?: InstanceActionParams;
}

interface UpdateInstancePayload {
  id: Identifier;
  instanceData: Record<string, unknown>;
}

interface TransactionStatusOptions extends QueryOptions<TransactionStatusResponse> {
  autoRefresh?: boolean;
}

const TERMINAL_TRANSACTION_STATUSES = new Set(["successful", "failed", "cancelled", "expired"]);

const getErrorMessage = (message: ApiMessage, fallback: string): string => {
  if (typeof message === "string" && message.trim() !== "") {
    return message;
  }

  if (message && typeof message === "object" && typeof message.message === "string") {
    return message.message;
  }

  return fallback;
};

const buildInstanceQueryString = (params: InstanceQueryParams = {}): string => {
  const defaultParams: InstanceQueryParams = {
    per_page: 10,
  };

  const queryParams = { ...defaultParams, ...params };

  return Object.keys(queryParams)
    .filter((key) => queryParams[key] !== undefined && queryParams[key] !== null)
    .map((key) => `${key}=${encodeURIComponent(String(queryParams[key]))}`)
    .join("&");
};

// GET: Fetch all instance requests
const fetchInstanceRequests = async (
  params: InstanceQueryParams = {}
): Promise<ApiEnvelope<InstanceRecord[]>> => {
  const queryString = buildInstanceQueryString(params);
  const uri = `/business/instances${queryString ? `?${queryString}` : ""}`;

  const res = await silentApi<ApiEnvelope<InstanceRecord[]>>("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch instance requests");
  }

  return res;
};

// GET: Fetch purchased instances (pending_payment removed)
const fetchPurchasedInstances = async (
  params: InstanceQueryParams = {}
): Promise<ApiEnvelope<InstanceRecord[]>> => {
  const queryString = buildInstanceQueryString(params);
  const uri = `/business/instances${queryString ? `?${queryString}` : ""}`;

  const res = await silentApi<ApiEnvelope<InstanceRecord[]>>("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch instance requests");
  }

  const instances = Array.isArray(res.data) ? res.data : [];

  return {
    ...res,
    data: instances.filter((instance) => instance.status !== "pending_payment"),
  };
};

// GET: Fetch instance request by ID
const fetchInstanceRequestById = async (id: Identifier): Promise<InstanceRecord> => {
  const res = await silentApi<ApiEnvelope<InstanceRecord>>("GET", `/business/instances/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch instance request with ID ${id}`);
  }

  return res.data;
};

// POST: Create a new instance request
const createInstanceRequest = async (instanceData: Record<string, unknown>): Promise<unknown> => {
  const res = await api("POST", "/business/instances", instanceData);
  if (!res.data) {
    throw new Error("Failed to create instance request");
  }

  return res.data;
};

// POST: Multi initiate request with enhanced response handling
const initiateMultiInstanceRequest = async (
  instanceData: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const res = await api("POST", "/business/instances/create", instanceData);
  if (!res) {
    throw new Error("Failed to initiate instance request");
  }

  return res as Record<string, unknown>;
};

// POST: Refresh instance status from provider
const refreshInstanceStatus = async (identifier: Identifier): Promise<Record<string, unknown>> => {
  const res = await api<ApiEnvelope<Record<string, unknown>>>(
    "POST",
    `/business/instance-management/${identifier}/refresh-status`
  );

  if (!res.success) {
    throw new Error(getErrorMessage(res.message, "Failed to refresh instance status"));
  }

  return (res.data as Record<string, unknown>) ?? {};
};

// GET: Get detailed instance information
const getInstanceDetails = async (identifier: Identifier): Promise<Record<string, unknown>> => {
  const res = await api<ApiEnvelope<Record<string, unknown>>>(
    "GET",
    `/business/instance-management/${identifier}`
  );

  if (!res.success) {
    throw new Error(getErrorMessage(res.message, "Failed to get instance details"));
  }

  return (res.data as Record<string, unknown>) ?? {};
};

// POST: Execute instance action (start, stop, reboot, etc.)
const executeInstanceAction = async (
  identifier: Identifier,
  action: string,
  params: InstanceActionParams = {}
): Promise<Record<string, unknown>> => {
  const res = await api<ApiEnvelope<Record<string, unknown>>>(
    "POST",
    `/business/instance-management/${identifier}/actions`,
    {
      action,
      params,
      confirmed: Boolean(params.confirmed),
    }
  );

  if (!res.success) {
    throw new Error(getErrorMessage(res.message, `Failed to execute ${action} action`));
  }

  return (res.data as Record<string, unknown>) ?? {};
};

// GET: Get transaction status
const getTransactionStatus = async (
  transactionId: Identifier
): Promise<TransactionStatusResponse> => {
  const res = await silentApi<ApiEnvelope<TransactionStatusResponse>>(
    "GET",
    `/business/transactions/${transactionId}/status`
  );

  if (!res.success) {
    throw new Error(getErrorMessage(res.message, "Failed to get transaction status"));
  }

  return (res.data as TransactionStatusResponse) ?? {};
};

// GET: Get transaction details with instances
const getTransactionDetails = async (
  transactionId: Identifier
): Promise<Record<string, unknown>> => {
  const res = await silentApi<ApiEnvelope<Record<string, unknown>>>(
    "GET",
    `/business/transactions/${transactionId}`
  );

  if (!res.success) {
    throw new Error(getErrorMessage(res.message, "Failed to get transaction details"));
  }

  return (res.data as Record<string, unknown>) ?? {};
};

// PATCH: Update an instance request
const updateInstanceRequest = async ({
  id,
  instanceData,
}: UpdateInstancePayload): Promise<unknown> => {
  const res = (await tenantApi(
    "PATCH",
    `/admin/instances/${id}`,
    instanceData
  )) as ApiEnvelope<unknown>;

  if (!res?.data) {
    throw new Error(`Failed to update instance request with ID ${id}`);
  }

  return res.data;
};

// Hook to fetch all instance requests
export const useFetchInstanceRequests = (
  params: InstanceQueryParams = {},
  options: QueryOptions<ApiEnvelope<InstanceRecord[]>> = {}
) => {
  return useQuery({
    queryKey: ["instanceRequests", params],
    queryFn: () => fetchInstanceRequests(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch all purchased instances
export const useFetchPurchasedInstances = (
  params: InstanceQueryParams = {},
  options: QueryOptions<ApiEnvelope<InstanceRecord[]>> = {}
) => {
  return useQuery({
    queryKey: ["instanceRequests", params],
    queryFn: () => fetchPurchasedInstances(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch instance request by ID
export const useFetchInstanceRequestById = (
  id: Identifier | null | undefined,
  options: QueryOptions<InstanceRecord> = {}
) => {
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["instanceRequest", id],
    queryFn: () => fetchInstanceRequestById(id as Identifier),
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

// Hook to create an instance request
export const useCreateInstanceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInstanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
    },
    onError: (error) => {
      logger.error("Error creating instance request:", error);
    },
  });
};

export const useInitiateMultiInstanceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: initiateMultiInstanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
    },
    onError: (error) => {
      logger.error("Error creating instance request:", error);
    },
  });
};

// Hook to update an instance request
export const useUpdateInstanceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInstanceRequest,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
      queryClient.invalidateQueries({ queryKey: ["instanceRequest", variables.id] });
    },
    onError: (error) => {
      logger.error("Error updating instance request:", error);
    },
  });
};

// Hook to refresh instance status
export const useRefreshInstanceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshInstanceStatus,
    onSuccess: (_data, identifier) => {
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
      queryClient.invalidateQueries({ queryKey: ["instanceRequest", identifier] });
      queryClient.invalidateQueries({ queryKey: ["instanceDetails", identifier] });
    },
    onError: (error) => {
      logger.error("Error refreshing instance status:", error);
    },
  });
};

// Hook to get detailed instance information
export const useGetInstanceDetails = (
  identifier: Identifier | null | undefined,
  options: QueryOptions<Record<string, unknown>> = {}
) => {
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["instanceDetails", identifier],
    queryFn: () => getInstanceDetails(identifier as Identifier),
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

// Hook to execute instance actions
export const useExecuteInstanceAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ identifier, action, params }: ExecuteActionPayload) =>
      executeInstanceAction(identifier, action, params ?? {}),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
      queryClient.invalidateQueries({ queryKey: ["instanceRequest", variables.identifier] });
      queryClient.invalidateQueries({ queryKey: ["instanceDetails", variables.identifier] });
    },
    onError: (error) => {
      logger.error("Error executing instance action:", error);
    },
  });
};

// Hook to get transaction status
export const useGetTransactionStatus = (
  transactionId: Identifier | null | undefined,
  options: TransactionStatusOptions = {}
) => {
  const { autoRefresh = false, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["transactionStatus", transactionId],
    queryFn: () => getTransactionStatus(transactionId as Identifier),
    enabled: Boolean(transactionId) && enabled,
    staleTime: 1000 * 30,
    refetchInterval: autoRefresh ? 30000 : false,
    refetchOnWindowFocus: true,
    ...queryOptions,
  });
};

// Hook to get transaction details
export const useGetTransactionDetails = (
  transactionId: Identifier | null | undefined,
  options: QueryOptions<Record<string, unknown>> = {}
) => {
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["transactionDetails", transactionId],
    queryFn: () => getTransactionDetails(transactionId as Identifier),
    enabled: Boolean(transactionId) && enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

// Hook to poll transaction status until completion
export const useTransactionPolling = (
  transactionId: Identifier | null | undefined,
  onComplete?: (data: TransactionStatusResponse) => void
) => {
  const queryClient = useQueryClient();
  const completionRef = useRef<string | null>(null);

  useEffect(() => {
    completionRef.current = null;
  }, [transactionId]);

  const pollingQuery = useQuery({
    queryKey: ["transactionPolling", transactionId],
    queryFn: () => getTransactionStatus(transactionId as Identifier),
    enabled: Boolean(transactionId),
    refetchInterval: (query) => {
      const data = query.state.data as TransactionStatusResponse | undefined;
      if (data?.status && TERMINAL_TRANSACTION_STATUSES.has(data.status)) {
        return false;
      }
      return 30000;
    },
  });

  useEffect(() => {
    const status = pollingQuery.data?.status;
    if (status !== "successful") {
      return;
    }

    const completionKey = String(transactionId ?? "");
    if (completionRef.current === completionKey) {
      return;
    }

    completionRef.current = completionKey;

    if (pollingQuery.data && onComplete) {
      onComplete(pollingQuery.data);
    }

    queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
    queryClient.invalidateQueries({ queryKey: ["transactionDetails", transactionId] });
  }, [onComplete, pollingQuery.data, queryClient, transactionId]);

  return pollingQuery;
};
