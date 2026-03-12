/**
 * useObjectStorage — React Query hooks for Object Storage (Silo Storage).
 *
 * Replaces the manual useState/useEffect/localStorage pattern in
 * ObjectStorageContext with proper server-state management via React Query.
 *
 * Hooks:
 *   useStorageAccounts(query)     — paginated account list
 *   useStorageAccount(id)         — single account detail
 *   useStorageBuckets(accountId)  — bucket list for an account
 *   useCreateBucket()             — create bucket mutation
 *   useDeleteBucket()             — delete bucket mutation
 *   useStorageObjects(...)        — list objects in a bucket
 *   useDeleteObject()             — delete object mutation
 *   useUploadFile()               — upload file mutation
 *   useStorageAnalytics(id)       — account analytics
 *   useStorageSubscription(id)    — subscription details
 *   useExtendStorage()            — extend storage mutation
 *   useAccessKeys / useCreateAccessKey / useRevokeAccessKey
 */
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import objectStorageApi from "../services/objectStorageApi";
import ToastUtils from "../utils/toastUtil";
import useAuthStore from "../stores/authStore";

// ─── Types ──────────────────────────────────────────────────────────

type Id = string | number;
type QueryParams = Record<string, string | number | boolean | null | undefined>;
type AnyRecord = Record<string, unknown>;

export interface AccountQueryState {
  page?: number;
  per_page?: number;
  [key: string]: string | number | boolean | null | undefined;
}

// ─── Query Key Factory ──────────────────────────────────────────────

export const storageKeys = {
  all: ["object-storage"] as const,

  accounts: (params?: AccountQueryState) => ["object-storage", "accounts", params ?? {}] as const,

  account: (id: Id) => ["object-storage", "account", String(id)] as const,

  buckets: (accountId: Id) => ["object-storage", "buckets", String(accountId)] as const,

  objects: (accountId: Id, bucketName: string, prefix?: string) =>
    ["object-storage", "objects", String(accountId), bucketName, prefix ?? ""] as const,

  analytics: (accountId: Id) => ["object-storage", "analytics", String(accountId)] as const,

  subscription: (accountId: Id) => ["object-storage", "subscription", String(accountId)] as const,

  extensionPricing: (accountId: Id) =>
    ["object-storage", "extension-pricing", String(accountId)] as const,

  transactions: (accountId: Id) => ["object-storage", "transactions", String(accountId)] as const,

  secretStatus: (accountId: Id, keyId: Id) =>
    ["object-storage", "secret-status", String(accountId), String(keyId)] as const,
};

// ─── Account Hooks ──────────────────────────────────────────────────

/** Fetch paginated storage accounts */
export function useStorageAccounts(
  params?: AccountQueryState,
  options?: Omit<UseQueryOptions<AnyRecord, Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<AnyRecord, Error>({
    queryKey: storageKeys.accounts(params),
    queryFn: async () => {
      const result = await objectStorageApi.fetchAccounts(params as QueryParams);
      return result as unknown as AnyRecord;
    },
    enabled: isAuthenticated && options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
}

/** Fetch a single storage account by ID */
export function useStorageAccount(
  accountId: Id | null | undefined,
  options?: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<unknown, Error>({
    queryKey: storageKeys.account(accountId ?? ""),
    queryFn: () => objectStorageApi.fetchAccount(accountId!),
    enabled: isAuthenticated && !!accountId && options?.enabled !== false,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
}

/** Delete a storage account */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { accountId: Id }>({
    mutationFn: ({ accountId }) => objectStorageApi.deleteAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.all });
      ToastUtils.success("Account deleted successfully.");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to delete account.");
    },
  });
}

// ─── Bucket Hooks ───────────────────────────────────────────────────

/** Fetch buckets for a storage account */
export function useStorageBuckets(
  accountId: Id | null | undefined,
  options?: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<unknown, Error>({
    queryKey: storageKeys.buckets(accountId ?? ""),
    queryFn: () => objectStorageApi.fetchBuckets(accountId!),
    enabled: isAuthenticated && !!accountId && options?.enabled !== false,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    ...options,
  });
}

/** Create a new bucket (silo) */
export function useCreateBucket() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { accountId: Id; payload: AnyRecord }>({
    mutationFn: ({ accountId, payload }) => objectStorageApi.createBucket(accountId, payload),
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: storageKeys.buckets(accountId) });
      queryClient.invalidateQueries({ queryKey: storageKeys.all });
      ToastUtils.success("Silo created successfully.");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to create silo.");
    },
  });
}

/** Delete a bucket (silo) */
export function useDeleteBucket() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { accountId: Id; bucketId: Id }>({
    mutationFn: ({ accountId, bucketId }) => objectStorageApi.deleteBucket(accountId, bucketId),
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: storageKeys.buckets(accountId) });
      queryClient.invalidateQueries({ queryKey: storageKeys.all });
      ToastUtils.success("Silo deleted successfully.");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to delete silo.");
    },
  });
}

// ─── Object (File) Hooks ────────────────────────────────────────────

/** List objects in a bucket */
export function useStorageObjects(
  accountId: Id | null | undefined,
  bucketName: string | null | undefined,
  prefix?: string,
  options?: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<unknown, Error>({
    queryKey: storageKeys.objects(accountId ?? "", bucketName ?? "", prefix),
    queryFn: () => objectStorageApi.listObjects(accountId!, bucketName!, prefix),
    enabled: isAuthenticated && !!accountId && !!bucketName && options?.enabled !== false,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
}

/** Delete an object from a bucket */
export function useDeleteObject() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { accountId: Id; bucketName: string; objectKey: string }>({
    mutationFn: ({ accountId, bucketName, objectKey }) =>
      objectStorageApi.deleteObject(accountId, bucketName, objectKey),
    onSuccess: (_data, { accountId, bucketName }) => {
      queryClient.invalidateQueries({
        queryKey: storageKeys.objects(accountId, bucketName),
      });
      ToastUtils.success("Object deleted successfully.");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to delete object.");
    },
  });
}

/** Upload a file to a bucket */
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    { accountId: Id; bucketName: string; objectKey: string; file: File | Blob }
  >({
    mutationFn: ({ accountId, bucketName, objectKey, file }) =>
      objectStorageApi.uploadFile(accountId, bucketName, objectKey, file),
    onSuccess: (_data, { accountId, bucketName }) => {
      queryClient.invalidateQueries({
        queryKey: storageKeys.objects(accountId, bucketName),
      });
      ToastUtils.success("File uploaded successfully.");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to upload file.");
    },
  });
}

/** Get a signed URL for an object */
export function useGetObjectUrl() {
  return useMutation<unknown, Error, { accountId: Id; bucketName: string; objectKey: string }>({
    mutationFn: ({ accountId, bucketName, objectKey }) =>
      objectStorageApi.getObjectUrl(accountId, bucketName, objectKey),
  });
}

/** Get a presigned upload URL */
export function useGetUploadUrl() {
  return useMutation<
    unknown,
    Error,
    { accountId: Id; bucketName: string; objectKey: string; contentType?: string }
  >({
    mutationFn: ({ accountId, bucketName, objectKey, contentType }) =>
      objectStorageApi.getUploadUrl(accountId, bucketName, objectKey, contentType),
  });
}

// ─── Analytics & Subscription Hooks ─────────────────────────────────

/** Fetch usage analytics for an account */
export function useStorageAnalytics(
  accountId: Id | null | undefined,
  options?: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<unknown, Error>({
    queryKey: storageKeys.analytics(accountId ?? ""),
    queryFn: () => objectStorageApi.getAnalytics(accountId!),
    enabled: isAuthenticated && !!accountId && options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
}

/** Fetch subscription details for an account */
export function useStorageSubscription(
  accountId: Id | null | undefined,
  options?: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<unknown, Error>({
    queryKey: storageKeys.subscription(accountId ?? ""),
    queryFn: () => objectStorageApi.getSubscription(accountId!),
    enabled: isAuthenticated && !!accountId && options?.enabled !== false,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
}

/** Fetch extension pricing for an account */
export function useStorageExtensionPricing(
  accountId: Id | null | undefined,
  options?: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<unknown, Error>({
    queryKey: storageKeys.extensionPricing(accountId ?? ""),
    queryFn: () => objectStorageApi.getExtensionPricing(accountId!),
    enabled: isAuthenticated && !!accountId && options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/** Extend storage quota */
export function useExtendStorage() {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    { accountId: Id; additionalGb: number; months?: number; fastTrack?: boolean }
  >({
    mutationFn: ({ accountId, additionalGb, months, fastTrack }) =>
      objectStorageApi.extendStorage(accountId, additionalGb, months, fastTrack),
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: storageKeys.account(accountId) });
      queryClient.invalidateQueries({ queryKey: storageKeys.subscription(accountId) });
      queryClient.invalidateQueries({ queryKey: storageKeys.all });
      ToastUtils.success("Storage extended successfully.");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to extend storage.");
    },
  });
}

/** Renew subscription */
export function useRenewSubscription() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { accountId: Id; months?: number }>({
    mutationFn: ({ accountId, months }) => objectStorageApi.renewSubscription(accountId, months),
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: storageKeys.subscription(accountId) });
      queryClient.invalidateQueries({ queryKey: storageKeys.all });
      ToastUtils.success("Subscription renewed successfully.");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to renew subscription.");
    },
  });
}

/** Cancel subscription */
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { accountId: Id; reason?: string | null }>({
    mutationFn: ({ accountId, reason }) => objectStorageApi.cancelSubscription(accountId, reason),
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: storageKeys.subscription(accountId) });
      queryClient.invalidateQueries({ queryKey: storageKeys.all });
      ToastUtils.success("Subscription cancelled.");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to cancel subscription.");
    },
  });
}

/** Reactivate a cancelled subscription */
export function useReactivateSubscription() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { accountId: Id }>({
    mutationFn: ({ accountId }) => objectStorageApi.reactivateSubscription(accountId),
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: storageKeys.subscription(accountId) });
      queryClient.invalidateQueries({ queryKey: storageKeys.all });
      ToastUtils.success("Subscription reactivated.");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to reactivate subscription.");
    },
  });
}

/** Fetch transactions for an account */
export function useStorageTransactions(
  accountId: Id | null | undefined,
  options?: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<unknown, Error>({
    queryKey: storageKeys.transactions(accountId ?? ""),
    queryFn: () => objectStorageApi.getTransactions(accountId!),
    enabled: isAuthenticated && !!accountId && options?.enabled !== false,
    staleTime: 1000 * 60,
    ...options,
  });
}

// ─── Access Key Hooks ───────────────────────────────────────────────

/** Check secret key reveal status */
export function useSecretKeyStatus(
  accountId: Id | null | undefined,
  accessKeyId: Id | null | undefined,
  options?: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<unknown, Error>({
    queryKey: storageKeys.secretStatus(accountId ?? "", accessKeyId ?? ""),
    queryFn: () => objectStorageApi.checkSecretStatus(accountId!, accessKeyId!),
    enabled: isAuthenticated && !!accountId && !!accessKeyId && options?.enabled !== false,
    staleTime: 0,
    ...options,
  });
}

/** Reveal secret key (one-time) */
export function useRevealSecretKey() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { accountId: Id; accessKeyId: Id }>({
    mutationFn: ({ accountId, accessKeyId }) =>
      objectStorageApi.revealSecretKey(accountId, accessKeyId),
    onSuccess: (_data, { accountId, accessKeyId }) => {
      queryClient.invalidateQueries({
        queryKey: storageKeys.secretStatus(accountId, accessKeyId),
      });
    },
  });
}

/** Create a new access key (rotation) */
export function useCreateAccessKey() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { accountId: Id; payload?: AnyRecord }>({
    mutationFn: ({ accountId, payload }) => objectStorageApi.createAccessKey(accountId, payload),
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: storageKeys.account(accountId) });
      ToastUtils.success("Access key created successfully.");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to create access key.");
    },
  });
}

/** Revoke an access key */
export function useRevokeAccessKey() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { accountId: Id; accessKeyId: Id }>({
    mutationFn: ({ accountId, accessKeyId }) =>
      objectStorageApi.revokeAccessKey(accountId, accessKeyId),
    onSuccess: (_data, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: storageKeys.account(accountId) });
      ToastUtils.success("Access key revoked.");
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to revoke access key.");
    },
  });
}

// ─── Order Hooks (client-side state via API) ────────────────────────

/** Create an object storage order */
export function useCreateStorageOrder() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, AnyRecord>({
    mutationFn: (payload) => objectStorageApi.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageKeys.all });
    },
    onError: (error) => {
      ToastUtils.error(error.message || "Failed to create order.");
    },
  });
}
