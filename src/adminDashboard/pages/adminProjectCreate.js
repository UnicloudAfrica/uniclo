import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernButton from "../components/ModernButton";
import { AdminCreateProjectForm } from "./projectComps/addProject";

const AdminProjectCreate = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const goBack = () => navigate("/admin-dashboard/projects");

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title="Create Project"
        description="Spin up a new workspace, assign a scope, and invite the right operators."
        actions={
          <ModernButton variant="outline" onClick={goBack}>
            Back to Projects
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        <AdminCreateProjectForm mode="page" onClose={goBack} />
      </AdminPageShell>
    </>
  );
};

export default AdminProjectCreate;
