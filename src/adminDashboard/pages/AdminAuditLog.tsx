import { useState } from "react";
import { Loader2, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AdminPageShell from "../components/AdminPageShell";
import { CLOUD_TERMS } from "@/shared/labels/cloudTerms";
import silentApi from "../../index/admin/silent";

export default function AdminAuditLog() {
  const term = CLOUD_TERMS.auditLog;
  const [filters, setFilters] = useState({ action: "", subject_type: "", from: "", to: "" });

  const log = useQuery({
    queryKey: ["audit-log", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
      const qs = params.toString() ? `?${params.toString()}` : "";
      const r = await silentApi("GET", `/migrations/audit-log${qs}`);
      return r;
    },
    refetchInterval: 1000 * 60,
  });

  const rows = ((log.data as { data?: unknown })?.data ?? []) as Array<Record<string, unknown>>;

  return (
    <AdminPageShell title={term.singular} description={term.description}>
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">
        <strong>Explained simply:</strong> {term.eli5}
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </div>
        <div className="grid grid-cols-4 gap-2">
          <input
            placeholder="Action (plan, execute, rollback...)"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
          />
          <input
            placeholder="Subject type"
            value={filters.subject_type}
            onChange={(e) => setFilters({ ...filters, subject_type: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
          />
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
          />
        </div>
      </section>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5 text-left">When</th>
              <th className="px-4 py-2.5 text-left">Who</th>
              <th className="px-4 py-2.5 text-left">Did what</th>
              <th className="px-4 py-2.5 text-left">On</th>
              <th className="px-4 py-2.5 text-left">From</th>
            </tr>
          </thead>
          <tbody>
            {log.isLoading ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Loading...
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400">No log entries match.</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">{row.actor?.name ?? row.actor?.email ?? `user ${row.actor_user_id ?? "—"}`}</td>
                  <td className="px-4 py-3 text-xs"><code>{row.action}</code></td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {String(row.subject_type ?? "").split("\\").pop()}
                    <span className="ml-1 text-slate-400">#{row.subject_id}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.ip_address ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminPageShell>
  );
}
