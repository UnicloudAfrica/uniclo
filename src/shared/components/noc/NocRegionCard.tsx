import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Server,
  AlertTriangle,
  Users,
  Activity,
  ExternalLink,
} from "lucide-react";
import {
  SurfaceCard,
  ProgressBar,
  StatusPill,
  type StatusTone,
} from "@/shared/components/ui";
import type { NocRegionSummary, NocStatus } from "@/hooks/adminHooks/nocHooks";

interface Props {
  region: NocRegionSummary;
}

/**
 * NocRegionCard composes the SurfaceCard, ProgressBar, and StatusPill
 * primitives into a clickable region tile. Navigation uses
 * `useNavigate()` so the parent SurfaceCard can be `as="button"` (better
 * a11y than nesting an <a> with content children).
 */
const STATUS_TO_TONE: Record<NocStatus, StatusTone> = {
  green: "success",
  amber: "warning",
  red: "danger",
  unknown: "neutral",
  offline: "neutral",
};

const STATUS_DOT_VAR: Record<NocStatus, string> = {
  green: "rgb(var(--theme-success-500))",
  amber: "rgb(var(--theme-warning-500))",
  red: "rgb(var(--theme-danger-500))",
  unknown: "rgb(var(--theme-neutral-400))",
  offline: "rgb(var(--theme-neutral-600))",
};

const STATUS_LABEL: Record<NocStatus, string> = {
  green: "Healthy",
  amber: "Degraded",
  red: "Critical",
  unknown: "Unknown",
  offline: "Offline",
};

const NocRegionCard: React.FC<Props> = ({ region }) => {
  const navigate = useNavigate();

  return (
    <SurfaceCard
      as="button"
      variant="card"
      padding="md"
      radius="lg"
      className="group w-full text-left"
      onClick={() => navigate(`/admin-dashboard/noc/regions/${region.code}`)}
      aria-label={`Open ${region.name} region detail. Status ${STATUS_LABEL[region.status]}.`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: STATUS_DOT_VAR[region.status] }}
              aria-hidden="true"
            />
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {region.name}
            </h3>
          </div>
          <p className="mt-0.5 text-[11px] text-gray-500">
            {region.city || region.country_code} • {region.cluster.name ?? region.code}
          </p>
        </div>
        <StatusPill
          label={STATUS_LABEL[region.status]}
          tone={STATUS_TO_TONE[region.status]}
          showIcon={false}
        />
      </div>

      {region.status_reason && region.status !== "green" && (
        <p className="mt-2 text-[10px] text-gray-500 italic">{region.status_reason}</p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <ProgressBar
          label="CPU"
          value={region.capacity.cpu_used_pct}
          tone="auto"
        />
        <ProgressBar
          label="Memory"
          value={region.capacity.memory_used_pct}
          tone="auto"
        />
      </div>

      <div className="db-surface-soft mt-3 grid grid-cols-4 gap-2 rounded-lg p-2">
        {[
          {
            icon: <Server className="h-3 w-3" />,
            label: "VMs",
            value: region.counts.vms,
            tone: "neutral" as const,
          },
          {
            icon: <Users className="h-3 w-3" />,
            label: "Tenants",
            value: region.counts.tenants,
            tone: "neutral" as const,
          },
          {
            icon: <Activity className="h-3 w-3" />,
            label: "VPCs",
            value: region.counts.vpcs,
            tone: "neutral" as const,
          },
          {
            icon: <AlertTriangle className="h-3 w-3" />,
            label: "Alarms",
            value: region.counts.open_alarms,
            tone: region.counts.open_alarms > 0 ? ("danger" as const) : ("neutral" as const),
          },
        ].map((stat) => (
          <div className="text-center" key={stat.label}>
            <div className="flex items-center justify-center gap-0.5 text-gray-400" aria-hidden="true">
              {stat.icon}
            </div>
            <div className="text-[10px] text-gray-500">{stat.label}</div>
            <div
              className="text-sm font-semibold"
              style={
                stat.tone === "danger"
                  ? { color: "rgb(var(--theme-danger-700))" }
                  : { color: "rgb(var(--theme-neutral-800))" }
              }
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
        <span>
          {region.cluster.nodes_active ?? 0}/{region.cluster.nodes_total ?? 0} nodes active
        </span>
        <span
          className="flex items-center gap-1 text-primary-600 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:transition-opacity"
          aria-hidden="true"
        >
          Open detail <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </SurfaceCard>
  );
};

export default NocRegionCard;
