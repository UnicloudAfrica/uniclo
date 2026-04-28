import React from "react";
import { Cpu, MemoryStick, HardDrive, AlertTriangle, Server } from "lucide-react";
import { Gauge, StatTile } from "@/shared/components/ui";

interface Props {
  cpu: number;
  memory: number;
  openAlarms: number;
  nodes: { active: number; total: number };
  counts: {
    vms: number;
    vpcs: number;
    tenants: number;
    eips_used: number;
    eips_available: number;
  };
  loading?: boolean;
}

const NocCapacityGauges: React.FC<Props> = ({
  cpu,
  memory,
  openAlarms,
  nodes,
  counts,
  loading = false,
}) => {
  const eipTotal = counts.eips_used + counts.eips_available;
  const eipPct = eipTotal > 0 ? (counts.eips_used / eipTotal) * 100 : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Gauge
        label="CPU"
        value={cpu}
        icon={<Cpu className="h-3.5 w-3.5" />}
        className="db-surface-card rounded-xl p-4"
      />
      <Gauge
        label="Memory"
        value={memory}
        icon={<MemoryStick className="h-3.5 w-3.5" />}
        className="db-surface-card rounded-xl p-4"
      />
      <Gauge
        label="Public IPs"
        value={eipPct}
        icon={<HardDrive className="h-3.5 w-3.5" />}
        className="db-surface-card rounded-xl p-4"
      />
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Nodes"
          value={`${nodes.active}/${nodes.total}`}
          icon={<Server className="h-3 w-3" />}
          loading={loading}
        />
        <StatTile
          label="VMs"
          value={counts.vms}
          icon={<Server className="h-3 w-3" />}
          loading={loading}
        />
        <StatTile
          label="Alarms"
          value={openAlarms}
          icon={<AlertTriangle className="h-3 w-3" />}
          tone={openAlarms > 0 ? "danger" : "neutral"}
          loading={loading}
        />
        <StatTile
          label="Tenants"
          value={counts.tenants}
          icon={<Server className="h-3 w-3" />}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default NocCapacityGauges;
