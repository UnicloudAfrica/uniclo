import React from "react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import { ModernButton } from "../../shared/components/ui";
import CreateProjectModal from "../components/addProject";

const DashboardProjectCreate: React.FC = () => {
  const navigate = useNavigate();
  const goBack = () => navigate("/dashboard/projects");

  return (
    <TenantPageShell
      title="Create Project"
      description="Launch a dedicated project workspace with its preferred defaults."
      subHeaderContent={
        <ModernButton variant="outline" onClick={goBack}>
          Back to Projects
        </ModernButton>
      }
      contentClassName="space-y-6"
    >
      <CreateProjectModal mode="page" onClose={goBack} />
    </TenantPageShell>
  );
};

export default DashboardProjectCreate;
