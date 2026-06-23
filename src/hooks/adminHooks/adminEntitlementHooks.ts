/**
 * Admin per-account entitlement hooks — the "give this specific account special
 * access" surface that sits on top of the account-type tiers.
 *
 * Mirrors adminAccountTypeHooks.ts / permissionHooks.ts: `silentApi` for the GET,
 * callable `api` for writes, and the react-query invalidation pattern shared across
 * the adminHooks files. Admin context base is `/admin/v1`, supplied by the shared
 * api client, so paths here are relative to that.
 *
 * `scope` ("tenant" | "client") selects the `/tenants/{id}` vs `/clients/{id}`
 * path. For clients, `{id}` is the user identifier (clients are users with
 * role='client').
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";
import type { AccountScope } from "./adminAccountTypeHooks";

type ApiEnvelope<T = unknown> = { data?: T; success?: boolean; message?: string };

/** Per-account entitlement snapshot from `GET /{scope}/{id}/entitlements`. */
export interface AccountEntitlements {
  /** The tier assigned to this account, or null when no tier is set. */
  account_type_id: number | null;
  /** Effective entitlement keys after applying tier + overrides. */
  resolved: string[];
  /** Entitlement keys granted by the assigned tier (before overrides). */
  type_entitlements: string[];
  /** Per-key overrides layered on top of the tier (true = force on, false = revoke). */
  overrides: Record<string, boolean>;
}

const basePath = (scope: AccountScope) => (scope === "tenant" ? "tenants" : "clients");

const entitlementsKey = (scope: AccountScope, id: string) =>
  ["account-entitlements", scope, id] as const;

const fetchAccountEntitlements = async (
  scope: AccountScope,
  id: string
): Promise<AccountEntitlements> => {
  const res = await silentApi<ApiEnvelope<AccountEntitlements>>(
    "GET",
    `/${basePath(scope)}/${id}/entitlements`
  );
  if (!res?.data) {
    throw new Error("Failed to fetch account entitlements");
  }
  return res.data;
};

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const useAccountEntitlements = (
  scope: AccountScope,
  id: string | null | undefined,
  options: QueryOptions<AccountEntitlements> = {}
) =>
  useQuery({
    queryKey: entitlementsKey(scope, id ?? ""),
    queryFn: () => fetchAccountEntitlements(scope, id as string),
    enabled: !!id,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    ...options,
  });

/** PUT the account's tier. `account_type_id: null` clears the tier. */
const assignAccountType = async (
  scope: AccountScope,
  id: string,
  accountTypeId: number | null
): Promise<AccountEntitlements> => {
  const res = await api<ApiEnvelope<AccountEntitlements>>(
    "PUT",
    `/${basePath(scope)}/${id}/account-type`,
    { account_type_id: accountTypeId }
  );
  if (!res?.data) {
    throw new Error("Failed to assign account type");
  }
  return res.data;
};

export const useAssignAccountType = (scope: AccountScope, id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountTypeId: number | null) => assignAccountType(scope, id, accountTypeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entitlementsKey(scope, id) });
    },
    onError: (error: unknown) => {
      logger.error("Error assigning account type:", error);
    },
  });
};

/**
 * PUT entitlement overrides. A value of `true`/`false` sets an override; `null`
 * clears it, reverting that key to the tier default.
 */
const setAccountEntitlements = async (
  scope: AccountScope,
  id: string,
  overrides: Record<string, boolean | null>
): Promise<void> => {
  const res = await api<ApiEnvelope>("PUT", `/${basePath(scope)}/${id}/entitlements`, {
    overrides,
  });
  if (!res?.success) {
    throw new Error("Failed to update entitlements");
  }
};

export const useSetAccountEntitlements = (scope: AccountScope, id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (overrides: Record<string, boolean | null>) =>
      setAccountEntitlements(scope, id, overrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entitlementsKey(scope, id) });
    },
    onError: (error: unknown) => {
      logger.error("Error updating account entitlements:", error);
    },
  });
};
