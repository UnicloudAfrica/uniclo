/**
 * createResourceHooks — Generic factory for context-aware CRUD hooks.
 *
 * Eliminates the 3× duplication of admin/tenant/client hook files by
 * using `useApiContext()` at call time to route requests to the correct
 * API client and URL prefix.
 *
 * Each resource only needs a small config (~15-25 lines) instead of
 * three ~150-line files.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import type { ApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../api/apiRegistry";
import logger from "@/utils/logger";

// ─── Types ─────────────────────────────────────────────────────────

interface ResourceHookConfig {
  /** URL path segment for the resource (e.g. "security-groups", "subnets") */
  resourcePath: string;
  /** Base string for React Query keys (e.g. "securityGroups", "subnets") */
  queryKeyBase: string;
  /**
   * Optional key within the API response that contains the data array.
   * Defaults to "data". Set to null to return the raw response.
   */
  dataKey?: string | null;
  /**
   * Whether the delete operation accepts an optional body payload.
   * Defaults to true (most resources accept a payload for force-delete etc.).
   */
  deleteAcceptsPayload?: boolean;
}

/** Parameters common to list/sync operations */
interface ListParams {
  projectId?: string | number | null;
  region?: string | null;
  /** Additional query params to append (e.g. per_page, status) */
  extra?: Record<string, string | number | boolean>;
}

type AnyRecord = Record<string, any>;

// ─── Query Key Factory ─────────────────────────────────────────────

export const createQueryKeys = (base: string) => ({
  /** Key for the list query: [base, context, { projectId, region }] */
  list: (context: ApiContext, params?: ListParams) =>
    [
      base,
      context,
      { projectId: params?.projectId ?? null, region: params?.region ?? null },
    ] as const,
  /** Key for a single-resource query: [base, "detail", context, id] */
  detail: (context: ApiContext, id: string | number) => [base, "detail", context, id] as const,
  /** Wildcard key for invalidating all queries of this resource */
  all: (context?: ApiContext) => (context ? ([base, context] as const) : ([base] as const)),
});

// ─── URL Builder ───────────────────────────────────────────────────

const buildListUrl = (urlPrefix: string, resourcePath: string, params?: ListParams): string => {
  const searchParams = new URLSearchParams();

  if (params?.projectId) {
    searchParams.set("project_id", String(params.projectId));
  }
  if (params?.region) {
    searchParams.set("region", String(params.region));
  }
  if (params?.extra) {
    for (const [key, value] of Object.entries(params.extra)) {
      searchParams.set(key, String(value));
    }
  }

  const qs = searchParams.toString();
  return `${urlPrefix}/${resourcePath}${qs ? `?${qs}` : ""}`;
};

// ─── Factory ───────────────────────────────────────────────────────

export function createResourceHooks<T = AnyRecord>(config: ResourceHookConfig) {
  const { resourcePath, queryKeyBase, dataKey = "data", deleteAcceptsPayload = true } = config;

  const queryKeys = createQueryKeys(queryKeyBase);

  // ── Fetch List ─────────────────────────────────────────────────

  const useFetchList = (
    params?: ListParams,
    options?: Omit<UseQueryOptions<T[], Error>, "queryKey" | "queryFn">
  ) => {
    const { context } = useApiContext();
    const entry = apiRegistry[context];
    const url = buildListUrl(entry.urlPrefix, resourcePath, params);

    return useQuery<T[], Error>({
      queryKey: queryKeys.list(context, params),
      queryFn: async () => {
        try {
          const res = await entry.silentApi.get<AnyRecord>(url);
          // dataKey=null means return raw response (for projects that need .data + .meta)
          if (dataKey === null) {
            return res as never;
          }
          if (dataKey && res && typeof res === "object" && dataKey in res) {
            return (res[dataKey] as T[]) ?? [];
          }
          return (Array.isArray(res) ? res : []) as T[];
        } catch (err) {
          logger.error(`[${queryKeyBase}] Failed to fetch list`, err);
          throw err;
        }
      },
      ...options,
    });
  };

  // ── Fetch By ID ────────────────────────────────────────────────

  const useFetchById = (
    id: string | number | null | undefined,
    options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
  ) => {
    const { context } = useApiContext();
    const entry = apiRegistry[context];

    return useQuery<T, Error>({
      queryKey: queryKeys.detail(context, id ?? ""),
      queryFn: async () => {
        try {
          const url = `${entry.urlPrefix}/${resourcePath}/${id}`;
          const res = await entry.silentApi.get<AnyRecord>(url);
          if (dataKey && res && typeof res === "object" && dataKey in res) {
            return res[dataKey] as T;
          }
          return res as T;
        } catch (err) {
          logger.error(`[${queryKeyBase}] Failed to fetch by id=${id}`, err);
          throw err;
        }
      },
      enabled: id != null && id !== "" && options?.enabled !== false,
      ...options,
    });
  };

  // ── Create ─────────────────────────────────────────────────────

  const useCreate = () => {
    const { context } = useApiContext();
    const entry = apiRegistry[context];
    const queryClient = useQueryClient();

    return useMutation<AnyRecord, Error, AnyRecord>({
      mutationFn: async (data: AnyRecord) => {
        const url = `${entry.urlPrefix}/${resourcePath}`;
        return entry.toastApi.post<AnyRecord>(url, data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.all(context) });
      },
    });
  };

  // ── Update ─────────────────────────────────────────────────────

  const useUpdate = () => {
    const { context } = useApiContext();
    const entry = apiRegistry[context];
    const queryClient = useQueryClient();

    return useMutation<AnyRecord, Error, { id: string | number; data: AnyRecord }>({
      mutationFn: async ({ id, data }) => {
        const url = `${entry.urlPrefix}/${resourcePath}/${id}`;
        return entry.toastApi.patch<AnyRecord>(url, data);
      },
      onSuccess: (_res, { id }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.all(context) });
        queryClient.invalidateQueries({ queryKey: queryKeys.detail(context, id) });
      },
    });
  };

  // ── Delete ─────────────────────────────────────────────────────

  const useDelete = () => {
    const { context } = useApiContext();
    const entry = apiRegistry[context];
    const queryClient = useQueryClient();

    return useMutation<AnyRecord, Error, { id: string | number; payload?: AnyRecord }>({
      mutationFn: async ({ id, payload }) => {
        const url = `${entry.urlPrefix}/${resourcePath}/${id}`;
        if (deleteAcceptsPayload && payload) {
          return entry.toastApi.delete<AnyRecord>(url, payload);
        }
        return entry.toastApi.delete<AnyRecord>(url);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.all(context) });
      },
    });
  };

  // ── Sync (re-fetch from cloud provider) ────────────────────────

  const useSync = () => {
    const { context } = useApiContext();
    const entry = apiRegistry[context];
    const queryClient = useQueryClient();

    return useMutation<T[], Error, ListParams>({
      mutationFn: async (params: ListParams) => {
        const syncParams: ListParams = { ...params, extra: { ...params.extra, refresh: true } };
        const url = buildListUrl(entry.urlPrefix, resourcePath, syncParams);
        const res = await entry.silentApi.get<AnyRecord>(url);
        if (dataKey === null) {
          return res as never;
        }
        if (dataKey && res && typeof res === "object" && dataKey in res) {
          return (res[dataKey] as T[]) ?? [];
        }
        return (Array.isArray(res) ? res : []) as T[];
      },
      onSuccess: (_data, params) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.list(context, params) });
      },
    });
  };

  return {
    /** Fetches the resource list with optional projectId/region filters */
    useFetchList,
    /** Fetches a single resource by ID */
    useFetchById,
    /** Creates a new resource */
    useCreate,
    /** Updates a resource by ID */
    useUpdate,
    /** Deletes a resource by ID (optionally with a payload for force-delete) */
    useDelete,
    /** Re-syncs resources from the cloud provider (refresh=true) */
    useSync,
    /** Query key factory for manual invalidation */
    queryKeys,
  };
}

export type ResourceHooks<T = AnyRecord> = ReturnType<typeof createResourceHooks<T>>;
