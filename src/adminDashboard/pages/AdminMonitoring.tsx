import AdminPageShell from "../components/AdminPageShell";
import MonitoringDashboard from "@/shared/components/monitoring/MonitoringDashboard";

const AdminMonitoring = () => {
  return (
    <AdminPageShell
      title="Monitoring"
      description="Monitor infrastructure with real-time metrics, alerts, and insights."
    >
      <MonitoringDashboard context="admin" />
    </AdminPageShell>
  );
};

export default AdminMonitoring;
