/**
 * React Query hooks for the admin Failed Jobs surface.
 *
 * Pairs with the backend Admin\Ops\FailedJobController. Lets ops retry
 * permanently-failed queue jobs (e.g. CopyVolumeDataJob) from the UI
 * instead of needing shell access for `php artisan queue:retry`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ToastUtils from "../../utils/toastUtil";
import silentApi from "../../index/admin/silent";

export interface FailedJob {
  id: number;
  uuid: string;
  connection: string;
  queue: string;
  payload: string;
  payload_preview: string;
  exception: string;
  failed_at: string;
}

interface PaginatedFailedJobs {
  data: FailedJob[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}

export function useFailedJobs(page = 1, perPage = 50) {
  return useQuery({
    queryKey: ["admin", "failed-jobs", page, perPage],
    queryFn: () =>
      silentApi<PaginatedFailedJobs>(
        "GET",
        `/ops/failed-jobs?page=${page}&per_page=${perPage}`
      ),
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useRetryFailedJob() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (uuid: string) =>
      silentApi<{ message: string; uuid: string }>("POST", `/ops/failed-jobs/${uuid}/retry`),
    onSuccess: (res) => {
      ToastUtils.success(res?.message ?? "Job re-queued.");
      qc.invalidateQueries({ queryKey: ["admin", "failed-jobs"] });
    },
    onError: (err: unknown) => {
      const message = (err as { message?: string })?.message ?? "Retry failed.";
      ToastUtils.error(message);
    },
  });
}

export function useRetryAllFailedJobs() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      silentApi<{ message: string; count: number }>("POST", `/ops/failed-jobs/retry-all`),
    onSuccess: (res) => {
      ToastUtils.success(res?.message ?? "All failed jobs re-queued.");
      qc.invalidateQueries({ queryKey: ["admin", "failed-jobs"] });
    },
    onError: (err: unknown) => {
      const message = (err as { message?: string })?.message ?? "Bulk retry failed.";
      ToastUtils.error(message);
    },
  });
}
