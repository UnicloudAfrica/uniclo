import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, DollarSign, Cpu, MemoryStick, Wallet } from "lucide-react";
import { CLOUD_TERMS } from "@/shared/labels/cloudTerms";
import HeroSection from "@/shared/components/ui/HeroSection";
import MetricTile from "@/shared/components/ui/MetricTile";
import GradientCard from "@/shared/components/ui/GradientCard";
import Sparkline from "@/shared/components/ui/Sparkline";
import { api } from "../../../lib/api";

interface SummaryResponse {
  data: {
    period: { from: string; to: string };
    currency: string;
    totals: Record<string, number>;
    cost: Record<string, number>;
    cost_total: number;
    projected_month: number;
    by_region: Record<string, Record<string, number>>;
  };
}

interface DailyResponse {
  data: Array<{ usage_date: string; vcpu_hours: number; ram_gb_hours: number; storage_gb_hours: number }>;
}

const fmtMoney = (currency: string, n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);

export default function UsageDashboard() {
  const term = CLOUD_TERMS.usage;

  const summary = useQuery({
    queryKey: ["usage-summary"],
    queryFn: async () => (await api.get<SummaryResponse>("/usage/summary", { silent: true }))?.data,
    staleTime: 1000 * 60,
  });

  const daily = useQuery({
    queryKey: ["usage-daily"],
    queryFn: async () => (await api.get<DailyResponse>("/usage/daily?days=30", { silent: true }))?.data ?? [],
    staleTime: 1000 * 60,
  });

  if (summary.isLoading || !summary.data) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading usage...
      </div>
    );
  }

  const s = summary.data;
  const series = (daily.data ?? []) as DailyResponse["data"];
  const vcpuValues = series.map((r) => Number(r.vcpu_hours ?? 0));

  return (
    <div className="space-y-6 p-6">
      <HeroSection
        term={term}
        accent="from-emerald-600 via-teal-600 to-cyan-600"
        icon={<Wallet className="h-7 w-7 text-white" />}
        title="Usage & Cost"
        subtitle={`Period: ${s.period.from} → ${s.period.to}`}
        metrics={
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricTile glass label="This period" value={fmtMoney(s.currency, s.cost_total)} icon={<DollarSign className="h-4 w-4" />} />
            <MetricTile glass label="Projected month" value={fmtMoney(s.currency, s.projected_month)} icon={<TrendingUp className="h-4 w-4" />} />
            <MetricTile glass label="vCPU-hours" value={s.totals.vcpu_hours.toLocaleString()} icon={<Cpu className="h-4 w-4" />} />
            <MetricTile glass label="RAM GB-hours" value={s.totals.ram_gb_hours.toLocaleString()} icon={<MemoryStick className="h-4 w-4" />} />
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <GradientCard title="vCPU usage · last 30 days" subtitle="How busy your machines have been." accent="from-indigo-500 to-blue-500">
          {series.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No usage data yet.</p>
          ) : (
            <div className="flex items-end justify-between gap-1">
              <Sparkline values={vcpuValues} width={400} height={80} color="text-indigo-500" />
            </div>
          )}
        </GradientCard>

        <GradientCard title="Cost by category" subtitle="Where your money goes." accent="from-rose-500 to-orange-500">
          <div className="space-y-2">
            {Object.entries(s.cost).map(([key, value]) => {
              const total = Number(s.cost_total) || 1;
              const pct = (Number(value) / total) * 100;
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="capitalize text-slate-600">{key.replaceAll("_", " ")}</span>
                    <span className="font-semibold text-slate-800">{fmtMoney(s.currency, Number(value))}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-400 to-orange-400 transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GradientCard>
      </div>

      <GradientCard title="Usage by region" accent="from-violet-500 to-purple-500">
        {Object.keys(s.by_region).length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No regional usage yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Region</th>
                  <th className="px-3 py-2 text-right">vCPU-hrs</th>
                  <th className="px-3 py-2 text-right">RAM GB-hrs</th>
                  <th className="px-3 py-2 text-right">Storage GB-hrs</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(s.by_region).map(([region, totals]) => (
                  <tr key={region} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs">{region}</td>
                    <td className="px-3 py-2 text-right">{Number(totals.vcpu_hours ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{Number(totals.ram_gb_hours ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{Number(totals.storage_gb_hours ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GradientCard>
    </div>
  );
}
