// @ts-nocheck
import React from "react";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import TemplateManager from "../../shared/components/templates/TemplateManager";

const TenantTemplates: React.FC = () => {
  return (
    <TenantPageShell
      title="Instance Templates"
      description="Create, edit, and manage reusable instance templates."
      contentClassName="space-y-6"
    >
      <TemplateManager />
    </TenantPageShell>
  );
};

export default TenantTemplates;
