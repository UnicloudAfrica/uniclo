import TenantPageShell from "@/shared/layouts/TenantPageShell";
import { DeveloperPortalContent } from "@/shared/components/developer";

const TenantDeveloperPortal = () => {
  return (
    <TenantPageShell
      title="Developer Portal"
      description="Manage API keys, webhooks, and usage analytics."
    >
      <DeveloperPortalContent context="tenant" />
    </TenantPageShell>
  );
};

export default TenantDeveloperPortal;
