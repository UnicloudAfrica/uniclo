// @ts-nocheck
import React from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import TemplateManager from "../../shared/components/templates/TemplateManager";

const AdminTemplates: React.FC = () => {
  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Instance Templates"
        description="Create, edit, and manage reusable instance templates."
        contentClassName="space-y-6"
      >
        <TemplateManager />
      </AdminPageShell>
    </>
  );
};

export default AdminTemplates;
