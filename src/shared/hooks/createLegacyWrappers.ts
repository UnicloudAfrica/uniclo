/**
 * createLegacyWrappers — Backward-compatible wrappers for resource hooks.
 *
 * Phase 4 introduced `createResourceHooks` which produces hooks with a NEW
 * ListParams-based signature:
 *   useFetchList(params?: { projectId, region, extra }, options?)
 *
 * But consumers (infraComps, etc.) still call with the OLD positional-arg
 * signature:
 *   useFetchSecurityGroups(projectId, region, options?)
 *   syncSecurityGroupsFromProvider({ project_id, region })
 *
 * These wrappers bridge the gap until consumers are rewritten in Phase 6.
 */
import { apiRegistry } from "../api/apiRegistry";
import type { ApiContext } from "@/hooks/useApiContext";
import type { ResourceHooks } from "./createResourceHooks";

type AnyRecord = Record<string, unknown>;

/**
 * Creates backward-compatible wrappers for resource hooks.
 * Maps the old positional-arg signatures to the new ListParams-based signatures.
 */
export function createLegacyWrappers<T = AnyRecord>(hooks: ResourceHooks<T>) {
  return {
    /**
     * Wraps useFetchList:
     *   OLD: (projectId?, region?, options?) => ...
     *   NEW: useFetchList({ projectId, region }, options)
     */
    useFetchList: (projectId?: string, region?: string, options?: unknown) =>
      hooks.useFetchList({ projectId, region }, options),

    /** Wraps useFetchById -- same signature, no changes needed */
    useFetchById: hooks.useFetchById,

    /** Wraps useCreate -- same signature */
    useCreate: hooks.useCreate,

    /** Wraps useUpdate -- same signature */
    useUpdate: hooks.useUpdate,

    /** Wraps useDelete -- same signature */
    useDelete: hooks.useDelete,

    /**
     * Wraps useSync to accept both old-style { project_id, region }
     * and new-style { projectId, region } params.
     */
    useSync: () => {
      const mutation = hooks.useSync();
      return {
        ...mutation,
        mutate: (params: unknown, options?: unknown) => {
          const mapped = {
            projectId: params?.projectId ?? params?.project_id,
            region: params?.region,
            extra: params?.extra,
          };
          return mutation.mutate(mapped, options);
        },
        mutateAsync: async (params: unknown, options?: unknown) => {
          const mapped = {
            projectId: params?.projectId ?? params?.project_id,
            region: params?.region,
            extra: params?.extra,
          };
          return mutation.mutateAsync(mapped, options);
        },
      };
    },

    /** Query keys -- same */
    queryKeys: hooks.queryKeys,
  };
}

/**
 * Creates a plain async sync function (NOT a hook) that re-fetches
 * from the cloud provider. This preserves the old
 * `syncXxxFromProvider(params)` calling convention.
 *
 * The function:
 *  1. Determines the API context from the current URL (admin/tenant/client)
 *  2. Builds a URL with the given params and `refresh=true`
 *  3. Calls the silent API and returns the data array.
 */
export function createSyncFunction(resourcePath: string, dataKey: string = "data") {
  return async (params: { project_id?: string; region?: string; [key: string]: unknown }) => {
    // Determine context from current URL path (same logic as useApiContext but
    // usable outside of React components/hooks).
    const path = window.location.pathname;
    let context: ApiContext = "tenant"; // default
    if (path.startsWith("/admin-dashboard") || path.startsWith("/admin")) {
      context = "admin";
    } else if (path.startsWith("/client")) {
      context = "client";
    }

    const entry = apiRegistry[context];
    const searchParams = new URLSearchParams();
    if (params.project_id) searchParams.set("project_id", params.project_id);
    if (params.region) searchParams.set("region", params.region);
    searchParams.set("refresh", "true");

    // Include any extra params (beyond project_id and region)
    for (const [key, value] of Object.entries(params)) {
      if (key !== "project_id" && key !== "region" && value != null) {
        searchParams.set(key, String(value));
      }
    }

    const url = `${entry.urlPrefix}/${resourcePath}?${searchParams.toString()}`;
    const res = await entry.silentApi.get<unknown>(url);

    if (dataKey && res && typeof res === "object" && dataKey in res) {
      return (res as unknown)[dataKey] ?? [];
    }
    return Array.isArray(res) ? res : [];
  };
}
