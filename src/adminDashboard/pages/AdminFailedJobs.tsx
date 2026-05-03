import { useState } from "react";
import { Loader2, RefreshCw, AlertTriangle, RotateCcw } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import {
  useFailedJobs,
  useRetryFailedJob,
  useRetryAllFailedJobs,
  type FailedJob,
} from "@/hooks/adminHooks/adminFailedJobsHooks";

/**
 * Admin Failed Jobs viewer + replayer.
 *
 * Pairs with /admin/v1/ops/failed-jobs in the API. The whole point is to
 * let ops retry permanently-failed queue jobs (typically CopyVolumeDataJob,
 * CopyCustomerImageJob, ProcessImageUploadJob) without dropping into a
 * shell to run `php artisan queue:retry`.
 *
 * Every retry is audit-logged on the backend.
 */
export default function AdminFailedJobs() {
  const [page, setPage] = useState(1);
  const [confirmRetryAll, setConfirmRetryAll] = useState(false);

  const failed = useFailedJobs(page, 25);
  const retryOne = useRetryFailedJob();
  const retryAll = useRetryAllFailedJobs();

  const rows: FailedJob[] = failed.data?.data ?? [];
  const total = failed.data?.total ?? 0;
  const lastPage = failed.data?.last_page ?? 1;

  return (
    <AdminPageShell
      title="Failed Jobs"
      description="Permanently-failed queue jobs you can replay without shell access."
      contentClassName="space-y-4"
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
        <strong>Explained simply:</strong> when a background job fails three
        times in a row (e.g. a volume copy timing out), it lands here. Click{" "}
        <em>Retry</em> on a row to re-queue it. Use <em>Retry all</em> after a
        transient outage (Keystone hiccup, network blip) to recover everything
        in one go. Every retry is recorded in the audit log.
      </div>

      <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {failed.isLoading ? (
            <span>Counting…</span>
          ) : total === 0 ? (
            <span>No failed jobs. Workers are healthy.</span>
          ) : (
            <span>
              <strong>{total}</strong> permanently-failed job{total === 1 ? "" : "s"}.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => failed.refetch()}
            disabled={failed.isFetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${failed.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            disabled={total === 0 || retryAll.isPending}
            onClick={() => setConfirmRetryAll(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry all
          </button>
        </div>
      </section>

      {confirmRetryAll && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100">
          <p className="font-medium">Re-queue all {total} failed jobs?</p>
          <p className="mt-1 text-xs">
            They'll be picked up by the next available worker. If the original
            failure was a real bug and not a transient outage, expect them to
            fail again. The action is recorded in the audit log.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={retryAll.isPending}
              onClick={async () => {
                await retryAll.mutateAsync();
                setConfirmRetryAll(false);
              }}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {retryAll.isPending ? "Re-queuing…" : "Confirm retry"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmRetryAll(false)}
              className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/30"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2.5 text-left">Failed at</th>
              <th className="px-4 py-2.5 text-left">Job</th>
              <th className="px-4 py-2.5 text-left">Queue</th>
              <th className="px-4 py-2.5 text-left">UUID</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {failed.isLoading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  Nothing failed. ✓
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.uuid}
                  className="border-t border-slate-100 dark:border-slate-800"
                >
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                    {row.failed_at
                      ? new Date(row.failed_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] dark:bg-slate-800">
                      {row.payload_preview ?? "(unknown)"}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                    {row.queue}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                    {row.uuid?.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={retryOne.isPending}
                      onClick={() => retryOne.mutate(row.uuid)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Retry
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800">
            <span>
              Page {page} of {lastPage}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
