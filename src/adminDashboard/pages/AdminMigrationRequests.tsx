import { useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../components/AdminPageShell";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import { CLOUD_TERMS } from "@/shared/labels/cloudTerms";
import api from "../../index/admin/api";
import silentApi from "../../index/admin/silent";
import ToastUtils from "@/utils/toastUtil";

export default function AdminMigrationRequests() {
  const term = CLOUD_TERMS.migrationRequest;
  const qc = useQueryClient();
  const [reviewing, setReviewing] = useState<Record<string, unknown> | null>(null);
  const [strategy, setStrategy] = useState("snapshot_restore");
  const [notes, setNotes] = useState("");

  const list = useQuery({
    queryKey: ["admin-migration-requests"],
    queryFn: async () => {
      const r = await silentApi("GET", "/migration-requests");
      return r;
    },
    refetchInterval: 1000 * 30,
  });

  const approve = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: unknown }) =>
      api("POST", `/migration-requests/${id}/approve`, body),
    onSuccess: () => {
      ToastUtils.success("Request approved. Migration planned.");
      qc.invalidateQueries({ queryKey: ["admin-migration-requests"] });
      setReviewing(null);
    },
  });

  const reject = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: unknown }) =>
      api("POST", `/migration-requests/${id}/reject`, body),
    onSuccess: () => {
      ToastUtils.success("Request rejected.");
      qc.invalidateQueries({ queryKey: ["admin-migration-requests"] });
      setReviewing(null);
    },
  });

  const rows = ((list.data as { data?: unknown })?.data ?? []) as Array<Record<string, unknown>>;

  return (
    <AdminPageShell title={term.plural} description={term.description}>
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">
        <strong>Explained simply:</strong> {term.eli5}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5 text-left">Tenant</th>
              <th className="px-4 py-2.5 text-left">From → To</th>
              <th className="px-4 py-2.5 text-left">Window</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading...
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400">No pending requests.</td></tr>
            ) : (
              rows.map((req) => (
                <tr key={req.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-xs">{req.tenant?.name ?? req.tenant_id}</td>
                  <td className="px-4 py-3 text-xs">
                    {req.source_provider}/{req.source_region}
                    <span className="mx-1 text-slate-400">→</span>
                    {req.target_region}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {req.preferred_window_start ? new Date(req.preferred_window_start).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {req.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => setReviewing(req)}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50"
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold">Review request</h3>
            <p className="mb-3 text-xs text-slate-600">
              <strong>Tenant:</strong> {reviewing.tenant?.name ?? reviewing.tenant_id}<br />
              <strong>Move from:</strong> {reviewing.source_provider}/{reviewing.source_region}<br />
              <strong>Move to:</strong> {reviewing.target_region}
            </p>
            {reviewing.customer_notes && (
              <div className="mb-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                <strong>Customer says:</strong> {reviewing.customer_notes}
              </div>
            )}
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="snapshot_restore">Snapshot & restore (with downtime)</option>
              <option value="live_export">Customer-driven export</option>
              <option value="manual">Track only (manual)</option>
            </select>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes (optional)"
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setReviewing(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                Cancel
              </button>
              <button
                onClick={() => reject.mutate({ id: reviewing.identifier, body: { admin_notes: notes } })}
                disabled={reject.isPending}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600"
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </button>
              <button
                onClick={() => approve.mutate({ id: reviewing.identifier, body: { strategy, admin_notes: notes } })}
                disabled={approve.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-sm text-white"
              >
                <Check className="h-3.5 w-3.5" />
                Approve & plan
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
