// @ts-nocheck
import React from "react";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import TemplateManager from "../../shared/components/templates/TemplateManager";

const ClientTemplates: React.FC = () => {
  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title="Instance Templates"
        description="Create, edit, and manage reusable instance templates."
        contentClassName="space-y-6"
        breadcrumbs={[{ label: "Home", href: "/client-dashboard" }, { label: "Templates" }]}
      >
        <TemplateManager />
      </ClientPageShell>
    </>
  );
};

export default ClientTemplates;
