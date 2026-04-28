import { useState } from "react";
import { Loader2, RefreshCw, Cpu, MemoryStick, HardDrive } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "@/shared/components/ui";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import { CLOUD_TERMS } from "@/shared/labels/cloudTerms";
import api from "../../index/admin/api";
import silentApi from "../../index/admin/silent";
import ToastUtils from "@/utils/toastUtil";

export default function AdminBareMetalNodes() {
  const term = CLOUD_TERMS.bareMetalNode;
  const qc = useQueryClient();
  const [region, setRegion] = useState("");

  const list = useQuery({
    queryKey: ["bare-metal", region],
    queryFn: async () => {
      const r = await silentApi("GET", region ? `/bare-metal-nodes?region=${region}` : "/bare-metal-nodes");
      return (r as { data?: unknown })?.data ?? (r as unknown) ?? [];
    },
    refetchInterval: 1000 * 30,
  });

  const sync = useMutation({
    mutationFn: async () => api("POST", "/bare-metal-nodes/sync", { region }),
    onSuccess: () => {
      ToastUtils.success("Pool synced.");
      qc.invalidateQueries({ queryKey: ["bare-metal"] });
    },
  });

  const setState = useMutation({
    mutationFn: async ({ id, target }: { id: string; target: string }) =>
      api("POST", `/bare-metal-nodes/${id}/state`, { target }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bare-metal"] }),
  });

  const rows = ((list.data as { data?: unknown })?.data ?? list.data ?? []) as Array<Record<string, unknown>>;

  return (
    <AdminPageShell
      title={term.plural}
      description={term.description}
      headerAction={
        <div className="flex items-center gap-2">
          <input
            placeholder="Region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          />
          <ModernButton size="sm" onClick={() => sync.mutate()} disabled={sync.isPending || !region}>
            {sync.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync from Ironic
          </ModernButton>
        </div>
      }
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">
        <strong>Explained simply:</strong> {term.eli5}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5 text-left">Hostname</th>
              <th className="px-4 py-2.5 text-left">Hardware</th>
              <th className="px-4 py-2.5 text-left">Region</th>
              <th className="px-4 py-2.5 text-left">State</th>
              <th className="px-4 py-2.5 text-left">Power</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading && rows.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">
                No nodes synced yet. Pick a region and click "Sync from Ironic".
              </td></tr>
            ) : (
              rows.map((n) => (
                <tr key={n.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">{n.hostname ?? n.identifier}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1"><Cpu className="h-3 w-3" />{n.cpus} cores</span>
                    <span className="ml-2 inline-flex items-center gap-1"><MemoryStick className="h-3 w-3" />{Math.round((n.memory_mb ?? 0) / 1024)} GB</span>
                    <span className="ml-2 inline-flex items-center gap-1"><HardDrive className="h-3 w-3" />{n.local_gb} GB</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{n.region}</td>
                  <td className="px-4 py-3"><StatusBadge status={n.provision_state} /></td>
                  <td className="px-4 py-3"><StatusBadge status={n.power_state} /></td>
                  <td className="px-4 py-3 text-right">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setState.mutate({ id: n.identifier, target: e.target.value });
                          e.target.value = "";
                        }
                      }}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    >
                      <option value="">Set state...</option>
                      <option value="manage">Manage</option>
                      <option value="provide">Provide</option>
                      <option value="active">Active</option>
                      <option value="rebuild">Rebuild</option>
                      <option value="deleted">Delete</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminPageShell>
  );
}
