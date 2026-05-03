import ClientPageShell from "../components/ClientPageShell";
import FlowDashboard from "@/shared/components/flow/FlowDashboard";

const ClientFlow = () => {
  return (
    <ClientPageShell
      title="SimpleDeploy"
      description="Automated server provisioning, site deployments, and SSL management."
    >
      <FlowDashboard basePath="/client-dashboard/flow" />
    </ClientPageShell>
  );
};

export default ClientFlow;
