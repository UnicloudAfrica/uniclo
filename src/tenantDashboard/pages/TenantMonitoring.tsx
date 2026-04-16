import TenantPageShell from "@/shared/layouts/TenantPageShell";
import MonitoringDashboard from "@/shared/components/monitoring/MonitoringDashboard";

const TenantMonitoring = () => {
  return (
    <TenantPageShell
      title="Monitoring"
      description="Monitor your infrastructure with real-time metrics, alerts, and insights."
    >
      <MonitoringDashboard context="tenant" />
    </TenantPageShell>
  );
};

export default TenantMonitoring;
