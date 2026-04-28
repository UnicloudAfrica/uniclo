import React from "react";
import { AlertTriangle, AlertCircle, Info, MapPin } from "lucide-react";
import { SurfaceCard, StatusPill, InfoCallout } from "@/shared/components/ui";
import type { NocAlarm } from "@/hooks/adminHooks/nocHooks";

interface Props {
  alarms: NocAlarm[];
  compact?: boolean;
}

const SEVERITY_TONE = {
  critical: "danger" as const,
  warning: "warning" as const,
  info: "info" as const,
};

const SEVERITY_ICON: Record<NocAlarm["_severity"], React.ReactNode> = {
  critical: <AlertTriangle className="h-3 w-3" />,
  warning: <AlertCircle className="h-3 w-3" />,
  info: <Info className="h-3 w-3" />,
};

const SEVERITY_BORDER: Record<NocAlarm["_severity"], string> = {
  critical: "rgb(var(--theme-danger-500))",
  warning: "rgb(var(--theme-warning-500))",
  info: "rgb(var(--theme-color-500))",
};

const formatTimeAgo = (iso: string): string => {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "—";
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const NocAlarmsFeed: React.FC<Props> = ({ alarms, compact = false }) => {
  if (!alarms.length) {
    return (
      <InfoCallout tone="success" role="status">
        No open alarms across the fleet.
      </InfoCallout>
    );
  }

  return (
    <ul
      className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1"
      role="list"
      aria-label="Open alarms"
    >
      {alarms.slice(0, compact ? 5 : 50).map((alarm) => (
        <li key={alarm.id}>
          <SurfaceCard
            variant="card"
            padding="sm"
            radius="md"
            className="border-l-4"
            style={{ borderLeftColor: SEVERITY_BORDER[alarm._severity] }}
          >
            <div className="flex items-start justify-between gap-2 text-xs">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusPill
                    label={alarm._severity}
                    tone={SEVERITY_TONE[alarm._severity]}
                    showIcon={false}
                    className="!px-2 !py-0 !text-[10px]"
                  />
                  <span
                    className="text-[10px] text-gray-500 flex items-center gap-1"
                    aria-label={`Region ${alarm._region_name}`}
                  >
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {alarm._region_name}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-gray-800 truncate">
                  <span className="sr-only">{alarm._severity}: </span>
                  <span aria-hidden="true">{SEVERITY_ICON[alarm._severity]}</span>{" "}
                  {alarm.type_name}
                </p>
                <p className="text-[10px] text-gray-500">
                  {alarm.entity_type} • {alarm.entity_id?.slice(0, 8)}…
                </p>
              </div>
              <time
                className="text-[10px] text-gray-400 whitespace-nowrap"
                dateTime={alarm.updated_at}
                title={new Date(alarm.updated_at).toISOString()}
              >
                {formatTimeAgo(alarm.updated_at)}
              </time>
            </div>
          </SurfaceCard>
        </li>
      ))}
    </ul>
  );
};

export default NocAlarmsFeed;
