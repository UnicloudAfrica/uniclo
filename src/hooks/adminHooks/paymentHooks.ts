import { useQuery, useMutation, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import fileApi from "../../index/admin/fileapi";

export type NullableId = string | number | null;

export interface AdminTransaction {
  id?: NullableId;
  identifier?: NullableId;
  reference?: string;
  status?: string;
  amount?: number | string | null;
  currency?: string;
  payment_gateway?: string;
  payment_type?: string;
  created_at?: string;
  user?: {
    name?: string;
    email?: string;
  };
  [key: string]: unknown;
}

export interface TransactionMeta {
  total?: number;
  last_page?: number;
  from?: number;
  to?: number;
  [key: string]: unknown;
}

export interface TransactionCollectionResponse {
  data: AdminTransaction[];
  meta: TransactionMeta | null;
  success: boolean;
  message?: string;
}

export interface TransactionQueryParams {
  page?: number;
  perPage?: number;
  status?: string;
  type?: string;
  search?: string;
}

export type TransactionIdentifier = string | number;
export type TransactionReceiptPayload = ArrayBuffer | Blob | Uint8Array | string;

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const buildQueryString = ({ page, perPage, status, type, search }: TransactionQueryParams) => {
  const params = new URLSearchParams();
  if (page) params.append("page", String(page));
  if (perPage) params.append("per_page", String(perPage));
  if (status) params.append("status", status);
  if (type) params.append("type", type);
  if (search) params.append("search", search);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const normaliseCollectionResponse = (res: unknown): TransactionCollectionResponse => {
  if (!res) {
    throw new TypeError("Unexpected response from server");
  }
  const response = asRecord(res);
  const data = response["data"];
  const meta = response["meta"] ?? response["pagination"] ?? null;

  const result: TransactionCollectionResponse = {
    data: Array.isArray(data) ? (data as AdminTransaction[]) : [],
    meta: typeof meta === "object" && meta !== null ? (meta as TransactionMeta) : null,
    success: typeof response["success"] === "boolean" ? response["success"] : true,
  };

  if (typeof response["message"] === "string") {
    result.message = response["message"];
  }

  return result;
};

const fetchTransactions = async (
  params: TransactionQueryParams = {}
): Promise<TransactionCollectionResponse> => {
  const query = buildQueryString(params);
  const res = await silentApi("GET", `/transactions${query}`);
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new TypeError("Failed to fetch transactions");
  }
  return payload;
};

const fetchTransactionById = async (
  transactionId: TransactionIdentifier
): Promise<Record<string, unknown>> => {
  if (!transactionId) {
    throw new TypeError("Transaction identifier is required");
  }
  const res = await silentApi("GET", `/transactions/${encodeURIComponent(transactionId)}`);
  const response = asRecord(res);
  if (!response["data"]) {
    throw new Error("Failed to fetch transaction details");
  }
  return asRecord(response["data"]);
};

const downloadTransactionReceipt = async (
  transactionId: TransactionIdentifier
): Promise<TransactionReceiptPayload> => {
  if (!transactionId) {
    throw new TypeError("Transaction identifier is required");
  }
  const buffer = await fileApi("GET", `/transactions/${encodeURIComponent(transactionId)}/receipt`);
  if (!buffer) {
    throw new Error("Failed to download receipt");
  }
  if (
    buffer instanceof Blob ||
    buffer instanceof ArrayBuffer ||
    ArrayBuffer.isView(buffer) ||
    typeof buffer === "string"
  ) {
    return buffer as TransactionReceiptPayload;
  }
  return JSON.stringify(buffer);
};

export const useFetchAdminTransactions = (
  { page = 1, perPage = 10, status = "", type = "", search = "" }: TransactionQueryParams = {},
  options: Omit<UseQueryOptions<TransactionCollectionResponse, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery<TransactionCollectionResponse, Error>({
    queryKey: ["adminTransactions", page, perPage, status, type, search],
    queryFn: () => fetchTransactions({ page, perPage, status, type, search }),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchAdminTransaction = (
  transactionId: TransactionIdentifier | null | undefined,
  options: Omit<UseQueryOptions<Record<string, unknown>, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery<Record<string, unknown>, Error>({
    queryKey: ["adminTransaction", transactionId],
    queryFn: () => fetchTransactionById(transactionId as TransactionIdentifier),
    enabled: Boolean(transactionId),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useDownloadAdminTransactionReceipt = (
  options: Omit<
    UseMutationOptions<TransactionReceiptPayload, Error, TransactionIdentifier>,
    "mutationFn"
  > = {}
) => {
  return useMutation<TransactionReceiptPayload, Error, TransactionIdentifier>({
    mutationFn: downloadTransactionReceipt,
    ...options,
  });
};
