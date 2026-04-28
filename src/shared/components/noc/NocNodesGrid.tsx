import React from "react";
import { CheckCircle2, AlertCircle, HardDrive, Cpu } from "lucide-react";
import { SurfaceCard, ResourceEmptyState } from "@/shared/components/ui";
import type { NocNode } from "@/hooks/adminHooks/nocHooks";

interface Props {
  nodes: NocNode[];
}

const formatUptime = (seconds: number | null | undefined): string => {
  const s = Number(seconds) || 0;
  if (s <= 0) return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
};

const NocNodesGrid: React.FC<Props> = ({ nodes }) => {
  if (!nodes.length) {
    return (
      <ResourceEmptyState
        title="No nodes reported"
        message="The cluster did not return any hypervisor nodes."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {nodes.map((n) => (
        <SurfaceCard key={n.id} variant="card" padding="md" radius="lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">{n.name}</div>
              <div className="text-[10px] text-gray-500 font-mono">{n.hostname}</div>
            </div>
            {n.services_ok ? (
              <CheckCircle2
                className="h-4 w-4"
                style={{ color: "rgb(var(--theme-success-500))" }}
                aria-label="All services active"
              />
            ) : (
              <AlertCircle
                className="h-4 w-4"
                style={{ color: "rgb(var(--theme-danger-500))" }}
                aria-label="Services degraded"
              />
            )}
          </div>
          <dl className="mt-3 space-y-1.5 text-[11px] text-gray-600">
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-gray-400" aria-hidden="true" />
              <dt className="sr-only">CPU</dt>
              <dd className="flex items-center gap-1">
                <span className="font-medium">{n.cpu_cores} cores</span>
                <span className="text-gray-400 truncate">
                  {n.cpu_model?.replace(/Intel\(R\) Xeon\(R\) /, "") ?? ""}
                </span>
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <HardDrive className="h-3 w-3 text-gray-400" aria-hidden="true" />
              <dt className="sr-only">Local storage</dt>
              <dd className="font-medium">{n.total_disk_gb} GB local</dd>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <dt className="text-gray-400">Uptime</dt>
              <dd className="font-semibold text-gray-700">{formatUptime(n.uptime)}</dd>
            </div>
            {n.access_ip && (
              <div className="flex items-center justify-between">
                <dt className="text-gray-400">Access</dt>
                <dd className="font-mono text-[10px] text-gray-700">{n.access_ip}</dd>
              </div>
            )}
          </dl>
        </SurfaceCard>
      ))}
    </div>
  );
};

export default NocNodesGrid;
