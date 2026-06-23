import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { ModernButton } from "@/shared/components/ui";
import TenantPageShell from "../components/TenantPageShell";
import RequirementsList from "@/shared/components/gate/RequirementsList";

const BASE = "/dashboard/requirements";

const TenantRequirements = () => {
  const navigate = useNavigate();
  return (
    <TenantPageShell
      title="Onboarding Forms"
      description="Build the forms your clients fill in — agreements, documents, ID checks and more. No code needed."
      actions={
        <ModernButton variant="primary" className="flex items-center gap-2" onClick={() => navigate(`${BASE}/new`)}>
          <Plus size={18} />
          New form
        </ModernButton>
      }
      contentClassName="space-y-6"
    >
      <RequirementsList basePath={BASE} />
    </TenantPageShell>
  );
};

export default TenantRequirements;
