import { useState } from "react";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import { useMutation } from "@tanstack/react-query";
import { apiRegistry } from "@/shared/api/apiRegistry";

type AnyRecord = Record<string, unknown>;

const AcfDirectProvision = () => {
  const entry = apiRegistry.admin;
  const [form, setForm] = useState({ tenant_id: "", service_type: "vm_migration", resource_type: "instance", resource_id: "", notes: "" });
  const [result, setResult] = useState<AnyRecord | null>(null);

  const provisionMutation = useMutation({
    mutationFn: async (payload: AnyRecord) => {
      const res = await entry.toastApi.post<AnyRecord>("/anycloudflow/provision-direct", payload);
      return res as AnyRecord;
    },
    onSuccess: (data) => setResult(data),
  });

  const handleProvision = () => {
    if (!form.tenant_id || !form.service_type) return;
    if (!confirm("This will provision the service immediately with NO billing. Are you sure?")) return;
    provisionMutation.mutate({
      ...form,
      resource_id: form.resource_id ? +form.resource_id : undefined,
      skip_billing: true,
      skip_quota: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-xl border-2 p-5" style={{ borderColor: designTokens.colors.error[300], backgroundColor: designTokens.colors.error[50] }}>
        <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0" style={{ color: designTokens.colors.error[500] }} />
        <div>
          <p className="font-bold" style={{ color: designTokens.colors.error[700] }}>Admin Backdoor — Direct Provisioning</p>
          <p className="text-sm" style={{ color: designTokens.colors.error[600] }}>This bypasses billing, quota checks, and approval. Use only for emergencies, demos, or internal testing. All actions are audit-logged.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6" style={{ borderColor: designTokens.colors.neutral[200] }}>
        <h4 className="mb-4 text-sm font-semibold" style={{ color: designTokens.colors.neutral[900] }}>Provision Service</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs font-medium">Tenant ID *</label><input value={form.tenant_id} onChange={(e) => setForm({ ...form, tenant_id: e.target.value })} placeholder="UUID" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }} /></div>
          <div><label className="mb-1 block text-xs font-medium">Service Type *</label>
            <select value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }}>
              <option value="vm_migration">VM Migration ($10/VM)</option>
              <option value="vm_replication">VM Replication ($5/VM/mo)</option>
              <option value="db_migration">Database Migration ($15/DB)</option>
              <option value="backup">Backup Orchestration ($3/VM/mo)</option>
            </select>
          </div>
          <div><label className="mb-1 block text-xs font-medium">Resource Type</label><input value={form.resource_type} onChange={(e) => setForm({ ...form, resource_type: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }} /></div>
          <div><label className="mb-1 block text-xs font-medium">Resource ID</label><input type="number" value={form.resource_id} onChange={(e) => setForm({ ...form, resource_id: e.target.value })} placeholder="Instance/DB ID" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }} /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium">Notes</label><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Reason for direct provision" className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: designTokens.colors.neutral[300] }} /></div>
        </div>
        <div className="mt-4">
          <button onClick={handleProvision} disabled={!form.tenant_id || provisionMutation.isPending} className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: designTokens.colors.error[600] }}>
            <AlertTriangle className="h-4 w-4" />{provisionMutation.isPending ? "Provisioning..." : "Provision Now (No Billing)"}
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-xl border p-5" style={{ borderColor: designTokens.colors.success[200], backgroundColor: designTokens.colors.success[50] }}>
          <p className="font-semibold" style={{ color: designTokens.colors.success[700] }}>Service provisioned successfully.</p>
          <pre className="mt-2 overflow-auto rounded bg-gray-900 p-3 text-xs text-green-400">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default AcfDirectProvision;
