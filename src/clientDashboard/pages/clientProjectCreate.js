import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import ModernButton from "../../adminDashboard/components/ModernButton";
import CreateProjectModal from "./projectComps/addProject";

const ClientProjectCreate = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen((previous) => !previous);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const goBack = () => navigate("/client-dashboard/projects");

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
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
