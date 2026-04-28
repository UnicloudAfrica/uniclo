import { useQuery } from "@tanstack/react-query";
import { Loader2, Server } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import { CLOUD_TERMS } from "@/shared/labels/cloudTerms";
import silentApi from "../../index/admin/silent";

export default function AdminCapacityDashboard() {
  const term = CLOUD_TERMS.capacity;

  const summary = useQuery({
    queryKey: ["capacity-summary"],
    queryFn: async () => {
      const r = await silentApi("GET", "/capacity/summary");
      return ((r as { data?: unknown })?.data ?? r) as Array<Record<string, unknown>>;
    },
    refetchInterval: 1000 * 30,
  });

  const rows = (summary.data ?? []) as Array<Record<string, unknown>>;

  return (
    <AdminPageShell title={term.singular} description={term.description}>
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">
        <strong>Explained simply:</strong> {term.eli5}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summary.isLoading && rows.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-400">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="col-span-full py-10 text-center text-sm text-slate-400">
            No capacity snapshots yet. Run <code>regions:snapshot-capacity</code>.
          </div>
        ) : (
          rows.map((row) => {
            const cpuUtil = Number(row.vcpu_utilisation ?? 0);
            const memUtil = Number(row.memory_utilisation ?? 0);
            const accent = (cpuUtil > 85 || memUtil > 85) ? "bg-red-50 border-red-200" :
                           (cpuUtil > 70 || memUtil > 70) ? "bg-amber-50 border-amber-200" :
                           "bg-white border-slate-200";

            return (
              <div key={`${row.provider}/${row.region}`} className={`rounded-2xl border p-4 ${accent}`}>
                <div className="mb-2 flex items-center gap-2">
                  <Server className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    {row.provider} / {row.region}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Last seen: {row.observed_at ? new Date(row.observed_at).toLocaleString() : "—"}
                </p>

                <div className="mt-3 space-y-2">
                  <Bar label="vCPUs" used={row.used_vcpus} total={row.total_vcpus} pct={cpuUtil} />
                  <Bar
                    label="Memory"
                    used={`${Math.round((row.used_memory_mb ?? 0) / 1024)} GB`}
                    total={`${Math.round((row.total_memory_mb ?? 0) / 1024)} GB`}
                    pct={memUtil}
                  />
                  <p className="text-xs text-slate-500">
                    {row.flavors_visible ?? 0} flavors visible
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </AdminPageShell>
  );
}

function Bar({ label, used, total, pct }: { label: string; used: number; total: number; pct: number }) {
  const color = pct > 85 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-500">
          {used} / {total} <span className="ml-1">({pct}%)</span>
        </span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
