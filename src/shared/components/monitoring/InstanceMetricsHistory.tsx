/**
 * InstanceMetricsHistory — deep historical CPU/memory/disk % charts for a
 * monitored instance, with a time-range picker (1h / 6h / 24h / 7d).
 *
 * Rendered natively inside unicloud (your branding). Data comes from
 * `useInstanceMetricsHistory`, which proxies CuberWatch through unicloud's
 * single partner credential — the customer never logs into CuberWatch.
 *
 * Honest-empty contract (mirrors InstanceLiveMetricsPanel): `source === "none"`
 * or no points → an empty-state placeholder, never fabricated data. A null in
 * any series becomes a gap in that line (connectNulls=false), never a 0.
 */
import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import {
  useInstanceMetricsHistory,
  type HistoryRange,
  type InstanceMetricsHistory,
} from "@/shared/hooks/useInstanceMetricsHistory";

export interface MergedHistoryPoint {
  t: string;
  cpu: number | null;
  memory: number | null;
  disk: number | null;
}

/**
 * Merge the three per-metric series into one timestamp-keyed array for Recharts.
 * Series may carry slightly different timestamps; a metric missing at a given
 * timestamp stays null (a gap), never a fabricated 0.
 */
export function mergeHistorySeries(
  metrics: InstanceMetricsHistory | null,
): MergedHistoryPoint[] {
  if (!metrics) {
    return [];
  }
  const byTs = new Map<string, MergedHistoryPoint>();
  const add = (
    points: { timestamp: string; value: number }[] | undefined,
    key: "cpu" | "memory" | "disk",
  ): void => {
    // Defensive: a malformed/unexpected payload (e.g. a scalar instead of a
    // series) must not crash the panel — treat anything non-array as empty.
    for (const p of Array.isArray(points) ? points : []) {
      const existing = byTs.get(p.timestamp) ?? {
        t: p.timestamp,
        cpu: null,
        memory: null,
        disk: null,
      };
      existing[key] = p.value;
      byTs.set(p.timestamp, existing);
    }
  };
  add(metrics.cpu_percent, "cpu");
  add(metrics.memory_percent, "memory");
  add(metrics.disk_percent, "disk");
  return Array.from(byTs.values()).sort((a, b) => a.t.localeCompare(b.t));
}

const RANGES: { key: HistoryRange; label: string }[] = [
  { key: "1h", label: "1h" },
  { key: "6h", label: "6h" },
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
];

const SERIES = [
  { key: "cpu", label: "CPU", color: "rgb(var(--theme-color-500))" },
  { key: "memory", label: "Memory", color: "rgb(var(--secondary-color-500))" },
  { key: "disk", label: "Disk", color: "rgb(var(--theme-success-600))" },
] as const;

const formatClock = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

interface InstanceMetricsHistoryProps {
  instanceId: string | number | null | undefined;
}

const InstanceMetricsHistory = ({ instanceId }: InstanceMetricsHistoryProps) => {
  const [range, setRange] = useState<HistoryRange>("6h");
  const { metrics, source, isLoading } = useInstanceMetricsHistory(
    instanceId,
    range,
  );

  const data = mergeHistorySeries(metrics);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {SERIES.map((s) => (
            <span
              key={s.key}
              className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 font-outfit"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: s.color }}
                aria-hidden="true"
              />
              {s.label}
            </span>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              aria-pressed={range === r.key}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium font-outfit ${
                range === r.key
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p
          className="py-10 text-center text-[11px] text-gray-400 font-outfit"
          role="status"
        >
          Loading history…
        </p>
      ) : source === "none" || data.length === 0 ? (
        <div
          className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-10 text-xs text-gray-500 font-outfit"
          role="status"
        >
          No history yet — this instance is not reporting to monitoring.
        </div>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--theme-surface-alt)"
              />
              <XAxis
                dataKey="t"
                tickFormatter={formatClock}
                tick={{ fontSize: 10, fill: "var(--theme-muted-color)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={48}
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
                formatter={(value: number | null, name) => [
                  value == null ? "—" : `${value}%`,
                  name,
                ]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  fontSize: "12px",
                }}
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
      )}
    </div>
  );
};

export default InstanceMetricsHistory;
