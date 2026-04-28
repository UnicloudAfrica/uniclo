import { useState } from "react";
import { Loader2, Save, Trash2, History } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CLOUD_TERMS } from "@/shared/labels/cloudTerms";
import ResourcePageHeader from "@/shared/components/ui/ResourcePageHeader";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import { api } from "../../../lib/api";
import ToastUtils from "@/utils/toastUtil";

export default function BackupPlans() {
  const term = CLOUD_TERMS.backupPlan;
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["backup-plans"],
    queryFn: async () =>
      (await api.get<{ data: unknown[] }>("/backup-schedules", { silent: true }))?.data ?? [],
    refetchInterval: 1000 * 30,
  });

  const summary = useQuery({
    queryKey: ["backup-summary"],
    queryFn: async () =>
      (await api.get<{ data: unknown }>("/backup-schedules/summary", { silent: true }))?.data,
    refetchInterval: 1000 * 60,
  });

  const create = useMutation({
    mutationFn: async (body: unknown) => api.post("/backup-schedules", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["backup-plans"] });
      qc.invalidateQueries({ queryKey: ["backup-summary"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (identifier: string) => api.delete(`/backup-schedules/${identifier}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["backup-plans"] }),
  });

  const [form, setForm] = useState({
    region: "",
    target_type: "volume",
    target_id: "",
    name: "",
    frequency: "daily",
    retention_count: 7,
    is_active: true,
  });

  const [historyOf, setHistoryOf] = useState<string | null>(null);
  const history = useQuery({
    queryKey: ["backup-runs", historyOf],
    queryFn: async () =>
      (await api.get<{ data: unknown[] }>(`/backup-schedules/${historyOf}/runs`, { silent: true }))?.data ?? [],
    enabled: !!historyOf,
  });

  const plans = (list.data ?? []) as Array<Record<string, unknown>>;
  const stats = summary.data as unknown;

  return (
    <div className="space-y-6 p-6">
      <ResourcePageHeader term={term} />

      {stats && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Active plans" value={stats.active_schedules} />
          <Stat label="Total backups taken" value={stats.completed_runs} />
          <Stat label="Failed backups" value={stats.failed_runs} accent={stats.failed_runs > 0 ? "red" : undefined} />
          <Stat
            label="Storage used"
            value={`${((stats.total_bytes ?? 0) / (1024 ** 3)).toFixed(1)} GB`}
          />
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-medium text-slate-700">New {term.singular.toLowerCase()}</h3>
        <div className="grid grid-cols-3 gap-3">
          <input
            placeholder="Region"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Plan name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={form.target_type}
            onChange={(e) => setForm({ ...form, target_type: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="volume">Disk</option>
            <option value="instance">Virtual Machine</option>
          </select>
          <input
            placeholder={`${form.target_type === "volume" ? "Disk" : "Machine"} ID to back up`}
            value={form.target_id}
            onChange={(e) => setForm({ ...form, target_id: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="hourly">Every hour</option>
            <option value="daily">Every day</option>
            <option value="weekly">Every week</option>
            <option value="monthly">Every month</option>
          </select>
          <input
            type="number"
            min={1}
            value={form.retention_count}
            onChange={(e) => setForm({ ...form, retention_count: Number(e.target.value) })}
            placeholder="Keep last N"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() =>
              create.mutate(form, {
                onSuccess: () => {
                  ToastUtils.success("Backup plan created.");
                  setForm({ ...form, name: "", target_id: "" });
                },
              })
            }
            disabled={create.isPending || !form.name || !form.target_id}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {term.cta}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        {list.isLoading && plans.length === 0 ? (
          <div className="py-10 text-center text-slate-400">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No {term.plural.toLowerCase()} yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {plans.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-slate-400">
                    {p.frequency} · keep last {p.retention_count} · {p.region}
                  </p>
                  {p.last_run_at && (
                    <p className="text-xs text-slate-400">
                      last backup: {new Date(p.last_run_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.is_active ? "active" : "paused"} />
                  <button
                    type="button"
                    onClick={() => setHistoryOf(p.identifier)}
                    title="History"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                  >
                    <History className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(p.identifier)}
                    className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {historyOf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Backup history</h3>
              <button onClick={() => setHistoryOf(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            {history.isLoading ? (
              <div className="py-6 text-center text-slate-400">Loading...</div>
            ) : (history.data ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">No backups taken yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {(history.data ?? []).map((run: unknown) => (
                  <li key={run.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-mono text-xs">{run.provider_snapshot_id ?? "—"}</p>
                      <p className="text-xs text-slate-400">
                        {run.started_at ? new Date(run.started_at).toLocaleString() : "—"}
                      </p>
                    </div>
                    <StatusBadge status={run.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: "red" }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent === "red" ? "border-red-200 bg-red-50/40" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-800">{value ?? 0}</p>
    </div>
  );
}
