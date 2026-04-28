import React from "react";
import { Globe, Server, Users, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { KpiTile } from "@/shared/components/ui";

interface Props {
  regionCount: number;
  totalVms: number;
  totalTenants: number;
  totalOpenAlarms: number;
  regionsGreen: number;
  regionsAmber: number;
  regionsRed: number;
  loading?: boolean;
}

/**
 * NocKpiStrip composes the KpiTile primitive into a six-tile KPI row
 * intended to live inside a SurfaceCard variant="signal-panel" hero.
 */
const NocKpiStrip: React.FC<Props> = ({
  regionCount,
  totalVms,
  totalTenants,
  totalOpenAlarms,
  regionsGreen,
  regionsAmber,
  regionsRed,
  loading = false,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <KpiTile
        icon={<Globe className="h-3.5 w-3.5" />}
        label="Regions"
        value={regionCount}
        tone="primary"
        loading={loading}
      />
      <KpiTile
        icon={<Server className="h-3.5 w-3.5" />}
        label="Total VMs"
        value={totalVms.toLocaleString()}
        tone="primary"
        loading={loading}
      />
      <KpiTile
        icon={<Users className="h-3.5 w-3.5" />}
        label="Tenants"
        value={totalTenants.toLocaleString()}
        tone="secondary"
        loading={loading}
      />
      <KpiTile
        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        label="Healthy"
        value={regionsGreen}
        tone="success"
        loading={loading}
      />
      <KpiTile
        icon={<AlertCircle className="h-3.5 w-3.5" />}
        label="Degraded"
        value={regionsAmber}
        tone="warning"
        loading={loading}
      />
      <KpiTile
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        label={regionsRed > 0 ? "Critical" : "Open Alarms"}
        value={regionsRed > 0 ? regionsRed : totalOpenAlarms}
        tone={regionsRed > 0 || totalOpenAlarms > 0 ? "danger" : "neutral"}
        loading={loading}
      />
    </div>
  );
};

export default NocKpiStrip;
