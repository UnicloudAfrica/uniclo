import TenantPageShell from "@/shared/layouts/TenantPageShell";
import FlowDashboard from "@/shared/components/flow/FlowDashboard";

const TenantFlow = () => {
  return (
    <TenantPageShell
      title="SlimDeploy"
      description="Automated server provisioning, site deployments, and SSL management."
    >
      <FlowDashboard basePath="/dashboard/flow" />
    </TenantPageShell>
  );
};

export default TenantFlow;
