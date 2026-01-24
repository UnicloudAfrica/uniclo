// @ts-nocheck
import React from "react";
import AdminPageShell from "../components/AdminPageShell";
import TemplateManager from "../../shared/components/templates/TemplateManager";

const AdminTemplates: React.FC = () => {
  return (
    <>
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
