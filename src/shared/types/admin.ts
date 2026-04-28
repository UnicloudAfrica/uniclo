/**
 * Shared admin API response types.
 * Used across admin hooks to type responses from the unified API client.
 */

/**
 * Generic API envelope returned by most admin endpoints.
 * Supports both `meta` and legacy `pagination` field for list responses.
 */
export interface ApiEnvelope<TData = unknown> {
  data?: TData;
  meta?: Record<string, unknown> | null;
  pagination?: Record<string, unknown> | null;
  message?: string;
  success?: boolean;
}

/**
 * Envelope for list/collection responses where data is an array.
 */
export interface ApiListEnvelope<TItem = unknown> {
  data?: TItem[];
  meta?: Record<string, unknown> | null;
  pagination?: Record<string, unknown> | null;
  message?: string;
  success?: boolean;
}

/**
 * Normalised collection response shape produced by hook helpers.
 */
export interface CollectionResponse<TItem = unknown> {
  data: TItem[];
  meta: Record<string, unknown> | null;
  message?: string;
  success?: boolean;
}

/**
 * Pagination params accepted by most admin list hooks.
 */
export interface AdminListParams {
  region?: string;
  provider?: string;
  page?: number | string;
  perPage?: number | string;
  search?: string;
}

/**
 * Common React Query options shape used throughout admin hooks.
 * Re-exported from hooks.ts for convenience.
 */
export type { QueryHookOptions } from "./hooks";

/**
 * Generic admin resource record (loose object shape).
 */
export type AdminResourceRecord = Record<string, unknown>;
