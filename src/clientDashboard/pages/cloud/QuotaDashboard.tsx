import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { CLOUD_TERMS } from "@/shared/labels/cloudTerms";
import ResourcePageHeader from "@/shared/components/ui/ResourcePageHeader";
import { api } from "../../../lib/api";

export default function QuotaDashboard() {
  const term = CLOUD_TERMS.quota;
  const [projectId, setProjectId] = useState("");
  const [region, setRegion] = useState("");

  const data = useQuery({
    queryKey: ["quota-dashboard", projectId, region],
    queryFn: async () =>
      (await api.get<{ data: unknown }>(`/quota/${projectId}?region=${region}`, { silent: true }))?.data,
    enabled: !!projectId && !!region,
    refetchInterval: 1000 * 60,
  });

  const quotas = (data.data?.quotas ?? []) as Array<Record<string, unknown>>;

  const labelFor = (key: string): string => ({
    instances: "Virtual Machines",
    cores: "vCPUs",
    ram_mb: "Memory (MB)",
    networks: "Private Networks",
    security_groups: "Firewalls",
    floating_ips: "Public IPs",
  } as Record<string, string>)[key] ?? key;

  return (
    <div className="space-y-6 p-6">
      <ResourcePageHeader term={term} />

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Workspace ID (e.g. proj-abc123)"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="Region (e.g. lagos-os-1)"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </section>

      {!projectId || !region ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
          Enter a workspace and region to see your quotas.
        </div>
      ) : data.isLoading ? (
        <div className="py-10 text-center text-slate-400">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 text-left">Resource</th>
                <th className="py-2 text-right">Used</th>
                <th className="py-2 text-right">Available</th>
                <th className="py-2 text-right">Max</th>
                <th className="py-2 text-left">Utilisation</th>
              </tr>
            </thead>
            <tbody>
              {quotas.map((q) => {
                const pct = Number(q.utilisation ?? 0);
                const color = pct > 85 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500";
                return (
                  <tr key={q.key} className="border-t border-slate-100">
                    <td className="py-2 text-slate-700">{labelFor(q.key)}</td>
                    <td className="py-2 text-right">{q.used}</td>
                    <td className="py-2 text-right">{q.available}</td>
                    <td className="py-2 text-right">{q.max}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
