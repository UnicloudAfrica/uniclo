import { useNavigate } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import ModernButton from "../../../adminDashboard/components/ModernButton";
import TenantAddPartnerWizard from "../../components/partners/TenantAddPartnerWizard";

export default function NewPartnerPage() {
  const navigate = useNavigate();

  return (
    <TenantPageShell
      title="Create Partner Workspace"
      description="Provision a new partner tenancy and walk through the full onboarding workflow."
      homeHref="/dashboard/clients"
      actions={
        <ModernButton variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </ModernButton>
      }
      contentClassName="space-y-8"
    >
      <TenantAddPartnerWizard
        onClose={() => navigate("/dashboard/clients?tab=partners")}
      />
    </TenantPageShell>
  );
}
