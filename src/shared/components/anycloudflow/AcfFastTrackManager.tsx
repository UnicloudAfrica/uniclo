import { useState } from "react";
import { Zap, Plus, Trash2, Clock, RefreshCw, Loader2 } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRegistry } from "@/shared/api/apiRegistry";

type AnyRecord = Record<string, unknown>;

const AcfFastTrackManager = () => {
  const entry = apiRegistry.admin;
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ tenant_id: "", service_type: "*", quota_override: "", expires_in_days: 14, reason: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["acf-fast-track"],
    queryFn: async () => { const r = await entry.silentApi.get<AnyRecord>("/anycloudflow/fast-track"); return (r as AnyRecord).data as AnyRecord; },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: AnyRecord) => entry.toastApi.post<AnyRecord>("/anycloudflow/fast-track", payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["acf-fast-track"] }); setShowCreate(false); },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => entry.toastApi.delete<AnyRecord>(`/anycloudflow/fast-track/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acf-fast-track"] }),
  });

  const extendMutation = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => entry.toastApi.patch<AnyRecord>(`/anycloudflow/fast-track/${id}/extend`, { days }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acf-fast-track"] }),
  });

  const grants = Array.isArray((data as AnyRecord)?.data) ? (data as AnyRecord).data as AnyRecord[] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: designTokens.colors.neutral[900] }}>Fast Track Grants</h3>
          <p className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>Grant tenants temporary access to services without payment. Expires automatically.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: designTokens.colors.warning[600] }}>
          <Zap className="h-4 w-4" />Grant Fast Track
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border bg-white p-6" style={{ borderColor: designTokens.colors.neutral[200] }}>
          <h4 className="mb-4 text-sm font-semibold">New Fast Track Grant</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-medium">Tenant ID *</label><input value={form.tenant_id} onChange={(e) => setForm({ ...form, tenant_id: e.target.value })} placeholder="UUID" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }} /></div>
            <div><label className="mb-1 block text-xs font-medium">Service Type</label>
              <select value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }}>
                <option value="*">All Services</option>
                <option value="vm_migration">VM Migration ($10/VM)</option>
                <option value="vm_replication">VM Replication ($5/VM/mo)</option>
                <option value="db_migration">Database Migration ($15/DB)</option>
                <option value="backup">Backup Orchestration ($3/VM/mo)</option>
              </select>
            </div>
            <div><label className="mb-1 block text-xs font-medium">Quota Override (blank = unlimited)</label><input type="number" value={form.quota_override} onChange={(e) => setForm({ ...form, quota_override: e.target.value })} placeholder="Unlimited" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }} /></div>
            <div><label className="mb-1 block text-xs font-medium">Expires In</label>
              <select value={form.expires_in_days} onChange={(e) => setForm({ ...form, expires_in_days: +e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }}>
                <option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option><option value={60}>60 days</option><option value={90}>90 days</option>
              </select>
            </div>
            <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium">Reason</label><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="POC evaluation, emergency DR, etc." className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }} /></div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => createMutation.mutate({ ...form, quota_override: form.quota_override ? +form.quota_override : null })} disabled={!form.tenant_id || createMutation.isPending} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: designTokens.colors.warning[600] }}>
              {createMutation.isPending ? "Granting..." : "Grant Fast Track"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: designTokens.colors.neutral[400] }} /></div> : grants.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center" style={{ borderColor: designTokens.colors.neutral[300] }}>
          <Zap className="mx-auto mb-3 h-10 w-10" style={{ color: designTokens.colors.neutral[300] }} />
          <p className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>No active fast track grants.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: designTokens.colors.neutral[200] }}>
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left text-xs" style={{ color: designTokens.colors.neutral[500] }}><th className="px-4 py-3">Tenant</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Quota</th><th className="px-4 py-3">Expires</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody>{grants.map((g: AnyRecord) => {
              const isExpired = g.status === "expired" || (g.expires_at && new Date(String(g.expires_at)) < new Date());
              return (
                <tr key={String(g.id)} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{(g.tenant as AnyRecord)?.name as string || String(g.tenant_id)}</td>
                  <td className="px-4 py-3"><span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{String(g.service_type) === "*" ? "All" : String(g.service_type).replace(/_/g, " ")}</span></td>
                  <td className="px-4 py-3">{g.quota_override === null ? "Unlimited" : String(g.quota_override)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: isExpired ? designTokens.colors.error[600] : designTokens.colors.neutral[600] }}>{g.expires_at ? new Date(String(g.expires_at)).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${g.status === "active" ? "bg-green-100 text-green-700" : g.status === "expired" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{String(g.status)}</span></td>
                  <td className="px-4 py-3 space-x-2">
                    {g.status === "active" && <><button onClick={() => extendMutation.mutate({ id: String(g.id), days: 14 })} className="text-xs text-blue-600 hover:underline"><RefreshCw className="inline h-3 w-3 mr-0.5" />+14d</button>
                    <button onClick={() => revokeMutation.mutate(String(g.id))} className="text-xs text-red-600 hover:underline"><Trash2 className="inline h-3 w-3 mr-0.5" />Revoke</button></>}
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AcfFastTrackManager;
