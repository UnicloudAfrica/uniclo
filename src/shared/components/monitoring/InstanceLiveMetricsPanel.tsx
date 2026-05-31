/**
 * InstanceLiveMetricsPanel — 4 live gauges (CPU / Memory / Disk / Network)
 * for a single monitored instance.
 *
 * Shared by the tenant and client monitoring pages so the gauge rendering +
 * honest-empty logic lives in one place. Consumes `useInstanceLiveMetrics`,
 * which resolves the caller's audience prefix automatically.
 *
 * Honest-empty contract:
 *  - `source === "none"` or `metrics === null` → "Not reporting to monitoring
 *    yet" placeholder, never fabricated zeros.
 *  - An individual null field → the gauge shows "—" (no value), never 0%.
 *
 * Network note: `network_in_mbps` / `network_out_mbps` are unbounded
 * throughput, not a percentage. The gauge arc uses a soft-capped *relative*
 * scale (100 Mbps = full) with a fixed primary tone, while the displayed
 * value is always the real Mbps total — the number shown is never fabricated.
 */
import { Cpu, MemoryStick, HardDrive, Network } from "lucide-react";

import { Gauge } from "@/shared/components/ui";
import { useInstanceLiveMetrics } from "@/shared/hooks/useInstanceLiveMetrics";

interface InstanceLiveMetricsPanelProps {
  instanceId: string | number | null | undefined;
  /** Gauge size — `sm` for compact table rows, `md` for roomier cards. */
  size?: "sm" | "md";
}

/** Soft cap (Mbps) at which the network arc reaches 100%. Visual only. */
const NETWORK_FULL_SCALE_MBPS = 100;

const isNum = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

/** A single percent gauge that renders "—" when the field is null. */
const PercentGauge = ({
  value,
  label,
  icon,
  size,
}: {
  value: number | null | undefined;
  label: string;
  icon: React.ReactNode;
  size: "sm" | "md";
}) => {
  const known = isNum(value);
  return (
    <Gauge
      value={known ? (value as number) : 0}
      label={label}
      icon={icon}
      size={size}
      tone={known ? "auto" : "secondary"}
      displayValue={known ? undefined : "—"}
    />
  );
};

const InstanceLiveMetricsPanel = ({ instanceId, size = "sm" }: InstanceLiveMetricsPanelProps) => {
  const { metrics, source } = useInstanceLiveMetrics(instanceId);

  if (source === "none" || metrics === null) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-xs text-gray-500 font-outfit"
        role="status"
      >
        Not reporting to monitoring yet — no live metrics for this instance.
      </div>
    );
  }

  const inMbps = isNum(metrics.network_in_mbps) ? metrics.network_in_mbps : 0;
  const outMbps = isNum(metrics.network_out_mbps) ? metrics.network_out_mbps : 0;
  const networkKnown = isNum(metrics.network_in_mbps) || isNum(metrics.network_out_mbps);
  const totalMbps = inMbps + outMbps;
  const networkArc = Math.min(100, (totalMbps / NETWORK_FULL_SCALE_MBPS) * 100);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <PercentGauge
          value={metrics.cpu_percent}
          label="CPU"
          icon={<Cpu className="h-3.5 w-3.5" />}
          size={size}
        />
        <PercentGauge
          value={metrics.memory_percent}
          label="Memory"
          icon={<MemoryStick className="h-3.5 w-3.5" />}
          size={size}
        />
        <PercentGauge
          value={metrics.disk_percent}
          label="Disk"
          icon={<HardDrive className="h-3.5 w-3.5" />}
          size={size}
        />
        <Gauge
          value={networkKnown ? networkArc : 0}
          label="Network"
          icon={<Network className="h-3.5 w-3.5" />}
          size={size}
          tone="primary"
          displayValue={networkKnown ? `${totalMbps.toFixed(1)} Mbps` : "—"}
        />
      </div>
      {networkKnown && (
        <p className="text-center text-[11px] text-gray-400 font-outfit">
          Network · {inMbps.toFixed(1)} Mbps in / {outMbps.toFixed(1)} Mbps out
        </p>
      )}
    </div>
  );
};

export default InstanceLiveMetricsPanel;
