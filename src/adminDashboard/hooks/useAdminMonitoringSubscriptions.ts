/**
 * Admin monitoring subscriptions hooks (B7 frontend).
 *
 * Pairs with the backend `MonitoringSubscriptionController` mounted under
 *   `/admin/v1/monitoring/subscriptions/*`
 * The admin baseURL `${API_BASE_URL}/admin/v1` is auto-prepended by the
 * shared `silentApi` client.
 *
 * Exposes:
 *  - useMonitoringSubscriptions(filters)        — paginated list
 *  - useMonitoringSubscriptionDetail(id)        — single subscription detail
 */
import { useQuery } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";

import type { MonitoringTier } from "./useAdminMonitoringPricing";

// ─── Types ────────────────────────────────────────────────────────────

export type SubscriptionStatus = string;
export type LastRunStatus = string;

export interface MonitoringSubscription {
  id: number;
  tenant_id: string;
  tenant_name: string;
  tier: MonitoringTier;
  status: SubscriptionStatus;
  monthly_cost_usd: number;
  currency: string;
  host_count: number;
  external_service_id: string | null;
  last_run_status: LastRunStatus | null;
  created_at: string;
}

export interface MonitoringSubscriptionAssignedHost {
  id: number | string;
  identifier: string;
  name: string | null;
  status: string | null;
  added_at: string | null;
}

export interface MonitoringSubscriptionEvent {
  id: number | string;
  type: string;
  status: string | null;
  message: string | null;
  occurred_at: string;
}

export interface MonitoringSubscriptionDetail extends MonitoringSubscription {
  assigned_hosts: MonitoringSubscriptionAssignedHost[];
  recent_events: MonitoringSubscriptionEvent[];
}

export interface MonitoringSubscriptionsFilters {
  tier?: MonitoringTier | "";
  status?: string;
  tenant_id?: string;
  has_cuberwatch_org?: boolean | "";
  page?: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
}

export interface MonitoringSubscriptionsResponse {
  data: MonitoringSubscription[];
  meta: PaginationMeta;
}

// ─── Query key factory ────────────────────────────────────────────────

export const monitoringSubscriptionKeys = {
  all: ["admin", "monitoring-subscriptions"] as const,
  list: (filters: MonitoringSubscriptionsFilters) =>
    [...monitoringSubscriptionKeys.all, "list", filters] as const,
  detail: (id: number | string) =>
    [...monitoringSubscriptionKeys.all, "detail", String(id)] as const,
};

// ─── Helpers ──────────────────────────────────────────────────────────

const buildQueryString = (filters: MonitoringSubscriptionsFilters): string => {
  const params = new URLSearchParams();
  if (filters.tier) params.set("tier", filters.tier);
  if (filters.status) params.set("status", filters.status);
  if (filters.tenant_id) params.set("tenant_id", filters.tenant_id);
  if (filters.has_cuberwatch_org !== undefined && filters.has_cuberwatch_org !== "") {
    params.set("has_cuberwatch_org", filters.has_cuberwatch_org ? "1" : "0");
  }
  if (filters.page) params.set("page", String(filters.page));
  const s = params.toString();
  return s ? `?${s}` : "";
};

// ─── Hooks ────────────────────────────────────────────────────────────

/**
 * Paginated list of all monitoring subscriptions, filterable by tier,
 * status, tenant_id and CuberWatch-org-presence.
 * Written by the backend `MonitoringSubscriptionController@index`.
 */
export function useMonitoringSubscriptions(filters: MonitoringSubscriptionsFilters) {
  return useQuery<MonitoringSubscriptionsResponse>({
    queryKey: monitoringSubscriptionKeys.list(filters),
    queryFn: async () => {
      const r = await silentApi<MonitoringSubscriptionsResponse>(
        "GET",
        `/monitoring/subscriptions${buildQueryString(filters)}`,
      );
      return {
        data: r?.data ?? [],
        meta: r?.meta ?? { current_page: 1, last_page: 1, total: 0 },
      };
    },
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Detail view for a single subscription including assigned_hosts and
 * recent_events.
 * Written by the backend `MonitoringSubscriptionController@show`.
 */
export function useMonitoringSubscriptionDetail(id: number | string | undefined) {
  return useQuery<MonitoringSubscriptionDetail>({
    queryKey: id
      ? monitoringSubscriptionKeys.detail(id)
      : [...monitoringSubscriptionKeys.all, "detail-pending"],
    queryFn: async () => {
      const r = await silentApi<{ data: MonitoringSubscriptionDetail }>(
        "GET",
        `/monitoring/subscriptions/${id}`,
      );
      if (!r?.data) throw new Error("Subscription not found.");
      return r.data;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
