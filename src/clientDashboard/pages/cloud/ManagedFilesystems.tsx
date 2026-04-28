import { useState } from "react";
import { Loader2, FolderArchive, Trash2, Plus, X } from "lucide-react";
import { managedFilesystems } from "@/hooks/openstackResourceHooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CLOUD_TERMS } from "@/shared/labels/cloudTerms";
import ResourcePageHeader from "@/shared/components/ui/ResourcePageHeader";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import { api } from "../../../lib/api";
import ToastUtils from "@/utils/toastUtil";

export default function SharedDrives() {
  const term = CLOUD_TERMS.sharedDrive;
  const { data, isFetching } = managedFilesystems.useList();
  const create = managedFilesystems.useCreate();
  const remove = managedFilesystems.useDelete();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    project_id: "",
    name: "",
    protocol: "NFS",
    size_gb: 100,
  });

  const [accessRules, setAccessRules] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({ access_type: "ip", access_to: "", access_level: "rw" });

  const rules = useQuery({
    queryKey: ["fs-rules", accessRules],
    queryFn: async () =>
      (await api.get<{ data: unknown[] }>(`/managed-filesystems/${accessRules}/access-rules`, { silent: true }))?.data ?? [],
    enabled: !!accessRules,
  });

  const grant = useMutation({
    mutationFn: async () => api.post(`/managed-filesystems/${accessRules}/access-rules`, newRule),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fs-rules", accessRules] });
      setNewRule({ access_type: "ip", access_to: "", access_level: "rw" });
    },
  });

  const revoke = useMutation({
    mutationFn: async (accessId: string) => api.delete(`/managed-filesystems/${accessRules}/access-rules/${accessId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fs-rules", accessRules] }),
  });

  const drives = (data?.data ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6 p-6">
      <ResourcePageHeader term={term} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-4 gap-3">
          <input
            placeholder="Workspace ID"
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Drive name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={form.protocol}
            onChange={(e) => setForm({ ...form, protocol: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="NFS">NFS (Linux)</option>
            <option value="CIFS">CIFS (Windows)</option>
          </select>
          <input
            type="number"
            min={1}
            value={form.size_gb}
            onChange={(e) => setForm({ ...form, size_gb: Number(e.target.value) })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Size GB"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => create.mutate(form, { onSuccess: () => ToastUtils.success(`${term.singular} creation started.`) })}
            disabled={create.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderArchive className="h-4 w-4" />}
            {term.cta}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        {isFetching && drives.length === 0 ? (
          <div className="py-10 text-center text-slate-400">Loading...</div>
        ) : drives.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">No {term.plural.toLowerCase()} yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {drives.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-slate-400">
                    {r.protocol} · {r.size_gb} GB · {r.region}
                  </p>
                  {r.export_location && (
                    <p className="font-mono text-xs text-slate-500">{r.export_location}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} />
                  <button
                    type="button"
                    onClick={() => setAccessRules(r.identifier)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Access rules
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(r.identifier)}
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

      {/* Access rules drawer */}
      {accessRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Who can access this drive?</h3>
              <button onClick={() => setAccessRules(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Add IP addresses, users, or certificates that should be allowed to mount this drive.
            </p>

            <div className="grid grid-cols-4 gap-2">
              <select
                value={newRule.access_type}
                onChange={(e) => setNewRule({ ...newRule, access_type: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
              >
                <option value="ip">IP address</option>
                <option value="user">User</option>
                <option value="cert">Certificate</option>
              </select>
              <input
                placeholder="e.g. 10.0.0.0/24 or username"
                value={newRule.access_to}
                onChange={(e) => setNewRule({ ...newRule, access_to: e.target.value })}
                className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
              <select
                value={newRule.access_level}
                onChange={(e) => setNewRule({ ...newRule, access_level: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
              >
                <option value="rw">Read &amp; write</option>
                <option value="ro">Read only</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => grant.mutate()}
              disabled={!newRule.access_to}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-1.5 text-xs text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Grant access
            </button>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-slate-500">Current rules</p>
              {rules.isLoading ? (
                <div className="py-4 text-center text-slate-400 text-xs">Loading...</div>
              ) : (rules.data ?? []).length === 0 ? (
                <p className="text-xs text-slate-400">No access rules yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {(rules.data ?? []).map((rule: unknown) => (
                    <li key={rule.id} className="flex items-center justify-between px-3 py-2 text-xs">
                      <div>
                        <span className="font-mono">{rule.access_to ?? rule.access ?? "—"}</span>
                        <span className="ml-2 text-slate-400">({rule.access_type ?? "—"})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => revoke.mutate(rule.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
