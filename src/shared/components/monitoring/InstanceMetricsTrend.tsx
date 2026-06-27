/**
 * InstanceMetricsTrend — a rolling live-trend chart (CPU / Memory / Disk %)
 * built from the 30s-polled CuberWatch live samples.
 *
 * Why client-side accumulation rather than a backfilled history endpoint:
 * the only normalised, provider-agnostic, contract-defined metric source is the
 * live gauge envelope (`useInstanceLiveMetrics`, source="cuberwatch"). The
 * provider time-series endpoint returns raw, Zadara-only data of un-normalised
 * shape, so it is not safe to render here. Deep/backfilled history is served by
 * the "View in Grafana" link-out (CuberWatch owns retention).
 *
 * Honest-data contract (mirrors InstanceLiveMetricsPanel):
 *  - only real observed samples are plotted — nothing is fabricated;
 *  - a null field becomes a gap in its line (never a 0);
 *  - the chart appears once there are ≥2 samples; before that we show a
 *    "collecting" hint rather than an empty axis.
 */
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import type { InstanceLiveMetrics } from "@/shared/hooks/useInstanceLiveMetrics";

export interface TrendPoint {
  /** Raw `collected_at` ISO string — also the dedup key. */
  t: string;
  cpu: number | null;
  memory: number | null;
  disk: number | null;
}

/** Max samples retained (20 × 30s ≈ 10 minutes of live trend). */
export const TREND_CAP = 20;

/**
 * Convert a live-metrics sample into a trend point, or null when there is
 * nothing real to plot (no timestamp, or all three fields null).
 */
export function toTrendPoint(metrics: InstanceLiveMetrics | null | undefined): TrendPoint | null {
  if (!metrics || !metrics.collected_at) {
    return null;
  }
  if (metrics.cpu_percent == null && metrics.memory_percent == null && metrics.disk_percent == null) {
    return null;
  }
  return {
    t: metrics.collected_at,
    cpu: metrics.cpu_percent,
    memory: metrics.memory_percent,
    disk: metrics.disk_percent,
  };
}

/**
 * Append a point to the rolling history: ignores nulls, dedups a repeated
 * `collected_at` (CuberWatch hasn't reported anything new), and caps length.
 */
export function appendSample(history: TrendPoint[], point: TrendPoint | null, cap = TREND_CAP): TrendPoint[] {
  if (!point) {
    return history;
  }
  if (history.length > 0 && history[history.length - 1].t === point.t) {
    return history;
  }
  const next = [...history, point];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

const formatClock = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const SERIES = [
  { key: "cpu", label: "CPU", color: "rgb(var(--theme-color-500))" },
  { key: "memory", label: "Memory", color: "rgb(var(--secondary-color-500))" },
  { key: "disk", label: "Disk", color: "rgb(var(--theme-success-600))" },
] as const;

interface InstanceMetricsTrendProps {
  /** The current live sample; the component accumulates successive values. */
  metrics: InstanceLiveMetrics | null;
}

const InstanceMetricsTrend = ({ metrics }: InstanceMetricsTrendProps) => {
  const [history, setHistory] = useState<TrendPoint[]>([]);

  useEffect(() => {
    setHistory((prev) => appendSample(prev, toTrendPoint(metrics)));
  }, [metrics?.collected_at]); // eslint-disable-line react-hooks/exhaustive-deps

  if (history.length < 2) {
    return (
      <p className="text-center text-[11px] text-gray-400 font-outfit" role="status">
        Collecting live trend… (updates every 30s)
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-4">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 font-outfit">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-surface-alt)" />
            <XAxis
              dataKey="t"
              tickFormatter={formatClock}
              tick={{ fontSize: 10, fill: "var(--theme-muted-color)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              domain={[0, 100]}
              width={32}
              tick={{ fontSize: 10, fill: "var(--theme-muted-color)" }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <Tooltip
              labelFormatter={(v) => formatClock(String(v))}
              formatter={(value: number | null, name) => [value == null ? "—" : `${value}%`, name]}
              contentStyle={{ borderRadius: "12px", border: "none", fontSize: "12px" }}
            />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InstanceMetricsTrend;
