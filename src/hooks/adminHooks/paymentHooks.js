import { useQuery, useMutation } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import fileApi from "../../index/admin/fileapi";

const buildQueryString = ({ page, perPage, status, type, search }) => {
  const params = new URLSearchParams();
  if (page) params.append("page", page);
  if (perPage) params.append("per_page", perPage);
  if (status) params.append("status", status);
  if (type) params.append("type", type);
  if (search) params.append("search", search);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const normaliseCollectionResponse = (res) => {
  if (!res) {
    throw new Error("Unexpected response from server");
  }
  return {
    data: res.data ?? [],
    meta: res.meta ?? res.pagination ?? null,
    success: res.success ?? true,
    message: res.message,
  };
};

const fetchTransactions = async (params = {}) => {
  const query = buildQueryString(params);
  const res = await silentApi("GET", `/transactions${query}`);
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch transactions");
  }
  return payload;
};

const fetchTransactionById = async (transactionId) => {
  if (!transactionId) {
    throw new Error("Transaction identifier is required");
  }
  const res = await silentApi(
    "GET",
    `/transactions/${encodeURIComponent(transactionId)}`
  );
  if (!res?.data) {
    throw new Error("Failed to fetch transaction details");
  }
  return res.data;
};

const downloadTransactionReceipt = async (transactionId) => {
  if (!transactionId) {
    throw new Error("Transaction identifier is required");
  }
  const buffer = await fileApi(
    "GET",
    `/transactions/${encodeURIComponent(transactionId)}/receipt`
  );
  if (!buffer) {
    throw new Error("Failed to download receipt");
  }
  return buffer;
};

export const useFetchAdminTransactions = (
  {
    page = 1,
    perPage = 10,
    status = "",
    type = "",
    search = "",
  } = {},
  options = {}
) => {
  return useQuery({
    queryKey: [
      "adminTransactions",
      page,
      perPage,
      status,
      type,
      search,
    ],
    queryFn: () =>
      fetchTransactions({ page, perPage, status, type, search }),
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchAdminTransaction = (
  transactionId,
  options = {}
) => {
  return useQuery({
    queryKey: ["adminTransaction", transactionId],
    queryFn: () => fetchTransactionById(transactionId),
    enabled: Boolean(transactionId),
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useDownloadAdminTransactionReceipt = (options = {}) => {
  return useMutation({
    mutationFn: downloadTransactionReceipt,
    ...options,
  });
};
