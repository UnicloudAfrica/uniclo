// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import { ModernButton } from "../../shared/components/ui";
import CreateProjectModal from "./projectComps/addProject";

const ClientProjectCreate: React.FC = () => {
  const navigate = useNavigate();

  const goBack = () => navigate("/client-dashboard/projects");

  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Create Project"
        description="Define your new project workspace and choose a default region."
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Projects", href: "/client-dashboard/projects" },
          { label: "Create Project" },
        ]}
        actions={
          <ModernButton variant="outline" onClick={goBack}>
            Back to Projects
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        <CreateProjectModal mode="page" onClose={goBack} />
      </ClientPageShell>
    </>
  );
};

export default ClientProjectCreate;
