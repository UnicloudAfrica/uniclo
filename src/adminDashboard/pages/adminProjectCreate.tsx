// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell.tsx";
import { ModernButton } from "../../shared/components/ui";
import { AdminCreateProjectForm } from "./projectComps/addProject";

const AdminProjectCreate = () => {
  const navigate = useNavigate();

  const goBack = () => navigate("/admin-dashboard/projects");

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
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
