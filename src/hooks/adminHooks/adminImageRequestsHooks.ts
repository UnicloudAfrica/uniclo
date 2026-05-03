/**
 * Admin Image Request hooks. Pairs with
 * Admin\Inventory\ImageRequestController. Surfaces the aggregated demand
 * view (group-by distro+version+region with request counts), and the
 * approve / bulk-approve / reject mutations.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import ToastUtils from "../../utils/toastUtil";

export interface AggregatedImageRequest {
  distro: string;
  version: string;
  arch: string;
  region: string;
  total_requests: number;
  unique_tenants: number;
  status: string;
  latest_request: string;
  identifier?: string;
}

export interface AdminImageRequestDetail {
  id: number;
  identifier: string;
  tenant_id: string;
  distro: string;
  version: string;
  arch: string;
  region: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  tenant?: { id: string; name: string };
  user?: { id: number; name: string; email: string };
}

export function useAggregatedImageRequests() {
  return useQuery<AggregatedImageRequest[]>({
    queryKey: ["admin", "image-requests", "aggregated"],
    queryFn: async () => {
      const r = await silentApi<{ data: AggregatedImageRequest[] }>(
        "GET",
        "/inventory/image-requests"
      );
      return r?.data ?? [];
    },
    refetchInterval: 60_000,
  });
}

export function useImageRequestDetail(identifier: string | undefined) {
  return useQuery({
    queryKey: ["admin", "image-request", identifier],
    queryFn: async () => {
      const r = await silentApi<{
        data: AdminImageRequestDetail;
        related_requests: AdminImageRequestDetail[];
      }>("GET", `/inventory/image-requests/${identifier}`);
      return r;
    },
    enabled: !!identifier,
  });
}

export function useApproveImageRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (identifier: string) =>
      silentApi<{ message: string }>(
        "POST",
        `/inventory/image-requests/${identifier}/approve`
      ),
    onSuccess: (res) => {
      ToastUtils.success(res?.message ?? "Approval queued.");
      qc.invalidateQueries({ queryKey: ["admin", "image-requests"] });
    },
    onError: (err: { message?: string } | Error) => {
      ToastUtils.error((err as { message?: string }).message ?? "Approval failed.");
    },
  });
}

export function useBulkApproveImageRequests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (identifiers: string[]) =>
      silentApi<{ message: string; errors: string[] }>(
        "POST",
        "/inventory/image-requests/bulk-approve",
        { identifiers }
      ),
    onSuccess: (res) => {
      ToastUtils.success(res?.message ?? "Bulk approval queued.");
      if (res?.errors?.length) {
        ToastUtils.warning(`${res.errors.length} item(s) skipped — see server log.`);
      }
      qc.invalidateQueries({ queryKey: ["admin", "image-requests"] });
    },
    onError: (err: { message?: string } | Error) => {
      ToastUtils.error((err as { message?: string }).message ?? "Bulk approval failed.");
    },
  });
}

export function useRejectImageRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ identifier, reason }: { identifier: string; reason: string }) =>
      silentApi<{ message: string }>(
        "POST",
        `/inventory/image-requests/${identifier}/reject`,
        { reason }
      ),
    onSuccess: (res) => {
      ToastUtils.success(res?.message ?? "Rejected.");
      qc.invalidateQueries({ queryKey: ["admin", "image-requests"] });
    },
    onError: (err: { message?: string } | Error) => {
      ToastUtils.error((err as { message?: string }).message ?? "Reject failed.");
    },
  });
}
