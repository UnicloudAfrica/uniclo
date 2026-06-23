/**
 * Admin account-type hooks — account-level entitlement bundles (tenant + client
 * tiers) and the entitlement catalogue for the admin area.
 *
 * Mirrors adminRoleHooks.ts: callable `api` for writes, `silentApi` for reads,
 * and the react-query invalidation pattern used across the adminHooks files.
 * Admin context base is `/admin/v1`, supplied by the shared api client, so paths
 * here are relative to that.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";

type ApiEnvelope<T = unknown> = { data?: T; success?: boolean; message?: string };

export type AccountScope = "tenant" | "client";

export type AccountTypeId = string | number;

/** An account-level entitlement bundle returned by `GET /account-types`. */
export interface AccountType {
  id: number;
  name: string;
  slug: string;
  description?: string;
  entitlements: string[];
  is_system: boolean;
  account_count: number;
}

/** Entitlement catalogue grouped by section, e.g. { "Support & SLA": ["priority_support", …] }. */
export type EntitlementCatalog = Record<string, string[]>;

export interface CreateAccountTypePayload {
  scope: AccountScope;
  name: string;
  description?: string;
  entitlements: string[];
}

export interface UpdateAccountTypePayload {
  name?: string;
  description?: string;
  entitlements?: string[];
}

interface UpdateAccountTypeArgs {
  id: AccountTypeId;
  data: UpdateAccountTypePayload;
}

const fetchAccountTypes = async (scope: AccountScope): Promise<AccountType[]> => {
  const res = await silentApi<ApiEnvelope<AccountType[]>>(
    "GET",
    `/account-types?scope=${scope}`
  );
  if (!res?.data) {
    throw new Error("Failed to fetch account types");
  }
  return res.data;
};

const fetchEntitlementCatalog = async (): Promise<EntitlementCatalog> => {
  const res = await silentApi<ApiEnvelope<EntitlementCatalog>>(
    "GET",
    "/account-types/catalog"
  );
  if (!res?.data) {
    throw new Error("Failed to fetch entitlement catalog");
  }
  return res.data;
};

const createAccountType = async (
  payload: CreateAccountTypePayload
): Promise<AccountType> => {
  const res = await api<ApiEnvelope<AccountType>>("POST", "/account-types", { ...payload });
  if (!res?.data) {
    throw new Error("Failed to create account type");
  }
  return res.data;
};

const updateAccountType = async ({
  id,
  data,
}: UpdateAccountTypeArgs): Promise<AccountType> => {
  const res = await api<ApiEnvelope<AccountType>>("PUT", `/account-types/${id}`, { ...data });
  if (!res?.data) {
    throw new Error("Failed to update account type");
  }
  return res.data;
};

const deleteAccountType = async (id: AccountTypeId): Promise<ApiEnvelope> => {
  const res = await api<ApiEnvelope>("DELETE", `/account-types/${id}`);
  if (!res?.success) {
    throw new Error("Failed to delete account type");
  }
  return res;
};

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const useAccountTypes = (
  scope: AccountScope,
  options: QueryOptions<AccountType[]> = {}
) =>
  useQuery({
    queryKey: ["account-types", scope],
    queryFn: () => fetchAccountTypes(scope),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useEntitlementCatalog = (options: QueryOptions<EntitlementCatalog> = {}) =>
  useQuery({
    queryKey: ["account-types-catalog"],
    queryFn: fetchEntitlementCatalog,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useCreateAccountType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAccountType,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["account-types", variables.scope] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating account type:", error);
    },
  });
};

export const useUpdateAccountType = (scope: AccountScope) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAccountType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-types", scope] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating account type:", error);
    },
  });
};

export const useDeleteAccountType = (scope: AccountScope) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAccountType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-types", scope] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting account type:", error);
    },
  });
};
