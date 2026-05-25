/**
 * Admin Tenant Report Subscriptions hooks (Stream A, task A4).
 *
 * Pairs with the backend `ReportSubscriptionController` mounted under
 *   `/admin/v1/tenants/{tenantId}/monitoring/report-subscriptions`
 * (the admin baseURL `${API_BASE_URL}/admin/v1` is auto-prepended by the
 * shared `silentApi` client, so call sites pass paths relative to it).
 *
 * Exposes:
 *  - useReportSubscriptions(tenantId)
 *  - useCreateReportSubscription(tenantId)
 *  - useUpdateReportSubscription(tenantId, id)
 *  - useDeleteReportSubscription(tenantId, id)
 *
 * Mutations invalidate the list query on success so the table reflects
 * the new state without a manual refetch.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";

// ─── Types ────────────────────────────────────────────────────────────

export type ReportCadence = "daily" | "weekly" | "monthly";
export type ReportOutput = "pdf" | "csv";
export type ReportRunStatus = "success" | "failure";

export interface ReportSubscription {
  id: number;
  cadence: ReportCadence;
  output: ReportOutput;
  recipients: string[];
  enabled: boolean;
  day_of_week: number | null;
  day_of_month: number | null;
  hour_of_day: number;
  timezone: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_run_status: ReportRunStatus | null;
}

export interface CreateReportSubscriptionPayload {
  cadence: ReportCadence;
  output: ReportOutput;
  recipients: string[];
  enabled?: boolean;
  day_of_week?: number | null;
  day_of_month?: number | null;
  hour_of_day: number;
  timezone: string;
}

export type UpdateReportSubscriptionPayload = Partial<CreateReportSubscriptionPayload>;

// ─── Query key factory ────────────────────────────────────────────────

export const reportSubscriptionKeys = {
  all: (tenantId: string) =>
    ["admin", "tenant-monitoring", tenantId, "report-subscriptions"] as const,
  list: (tenantId: string) =>
    [...reportSubscriptionKeys.all(tenantId), "list"] as const,
};

const basePath = (tenantId: string) =>
  `/tenants/${tenantId}/monitoring/report-subscriptions`;

// ─── Hooks ────────────────────────────────────────────────────────────

/**
 * List the tenant's scheduled report subscriptions.
 * Written by the backend `ReportSubscriptionController@index`.
 */
export function useReportSubscriptions(tenantId: string | undefined) {
  return useQuery<ReportSubscription[]>({
    queryKey: tenantId
      ? reportSubscriptionKeys.list(tenantId)
      : ["admin", "tenant-monitoring", "report-subscriptions-pending"],
    queryFn: async () => {
      const r = await silentApi<{ data: ReportSubscription[] }>(
        "GET",
        basePath(tenantId as string)
      );
      return r?.data ?? [];
    },
    enabled: !!tenantId,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Create a new scheduled report subscription for the tenant.
 * Written by the backend `ReportSubscriptionController@store`.
 */
export function useCreateReportSubscription(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<ReportSubscription, Error, CreateReportSubscriptionPayload>({
    mutationFn: async (payload) => {
      if (!tenantId) throw new Error("Missing tenant id.");
      const r = await silentApi<{ data: ReportSubscription }>(
        "POST",
        basePath(tenantId),
        payload as unknown as Record<string, unknown>
      );
      return r.data;
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({
          queryKey: reportSubscriptionKeys.list(tenantId),
        });
      }
    },
  });
}

/**
 * Update an existing report subscription. Accepts a partial payload so the
 * caller can send only the changed fields (used by both the edit modal and
 * the inline enabled toggle).
 */
export function useUpdateReportSubscription(
  tenantId: string | undefined,
  id: number | undefined
) {
  const queryClient = useQueryClient();
  return useMutation<ReportSubscription, Error, UpdateReportSubscriptionPayload>({
    mutationFn: async (payload) => {
      if (!tenantId) throw new Error("Missing tenant id.");
      if (id == null) throw new Error("Missing subscription id.");
      const r = await silentApi<{ data: ReportSubscription }>(
        "PATCH",
        `${basePath(tenantId)}/${id}`,
        payload as unknown as Record<string, unknown>
      );
      return r.data;
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({
          queryKey: reportSubscriptionKeys.list(tenantId),
        });
      }
    },
  });
}

/**
 * Delete an existing report subscription. Backend returns 204 with no body.
 */
export function useDeleteReportSubscription(
  tenantId: string | undefined,
  id: number | undefined
) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Missing tenant id.");
      if (id == null) throw new Error("Missing subscription id.");
      await silentApi<void>("DELETE", `${basePath(tenantId)}/${id}`);
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({
          queryKey: reportSubscriptionKeys.list(tenantId),
        });
      }
    },
  });
}

// ─── Test-only helpers ────────────────────────────────────────────────

/**
 * Curated list of common IANA timezones for the picker. The user can also
 * type a custom name via the "Other" option, so this list does not need
 * to be exhaustive — just the most common Africa-region defaults.
 */
export const COMMON_TIMEZONES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "UTC", label: "UTC" },
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)" },
  { value: "Africa/Cairo", label: "Africa/Cairo (EET)" },
  { value: "Africa/Accra", label: "Africa/Accra (GMT)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "America/New_York", label: "America/New_York (ET)" },
];

export const __testables = {
  basePath,
};
