import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { migrationRequests } from "@/hooks/openstackResourceHooks";
import ToastUtils from "@/utils/toastUtil";

export default function MigrationRequestPage() {
  const { data, isFetching } = migrationRequests.useList();
  const create = migrationRequests.useCreate();

  const [form, setForm] = useState({
    source_availability_zone: "",
    source_region: "",
    target_region: "",
    customer_notes: "",
    preferred_window_start: "",
    preferred_window_end: "",
  });

  const requests = (data?.data ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">Migrate to OpenStack</h1>
        <p className="text-sm text-slate-500">
          Request a migration of your existing resources to an OpenStack region. Our team reviews and schedules.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Source availability zone (e.g. uni-ng-az-1)"
            value={form.source_availability_zone}
            onChange={(e) => setForm({ ...form, source_availability_zone: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Source region"
            value={form.source_region}
            onChange={(e) => setForm({ ...form, source_region: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Target region (e.g. lagos-os-1)"
            value={form.target_region}
            onChange={(e) => setForm({ ...form, target_region: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={form.preferred_window_start}
            onChange={(e) => setForm({ ...form, preferred_window_start: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            value={form.preferred_window_end}
            onChange={(e) => setForm({ ...form, preferred_window_end: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <textarea
          placeholder="Notes for the migration team (optional)"
          rows={3}
          value={form.customer_notes}
          onChange={(e) => setForm({ ...form, customer_notes: e.target.value })}
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() =>
              create.mutate(form, {
                onSuccess: () => ToastUtils.success("Migration request submitted."),
              })
            }
            disabled={create.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit request
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3 text-sm font-medium text-slate-600">
          My requests
        </div>
        {isFetching && requests.length === 0 ? (
          <div className="py-10 text-center text-slate-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No requests yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {requests.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {String(r.source_availability_zone ?? "")} / {String(r.source_region ?? "")} → {String(r.target_region ?? "")}
                  </p>
                  <p className="font-mono text-xs text-slate-400">{String(r.identifier ?? "")}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
