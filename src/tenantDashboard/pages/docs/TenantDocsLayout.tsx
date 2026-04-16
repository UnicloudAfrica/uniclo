import React from "react";
import { Outlet } from "react-router-dom";
import TenantPageShell from "@/shared/layouts/TenantPageShell";
import ConfigDocsSidebar from "@/docs/renderer/ConfigDocsSidebar";
import { tenantDocSections } from "@/docs/config/tenantDocs";

const TenantDocsLayout: React.FC = () => (
  <TenantPageShell title="Documentation" disableContentPadding>
    <div className="flex">
      <div className="sticky top-0 self-start h-[calc(100vh-140px)] overflow-y-auto">
        <ConfigDocsSidebar
          sections={tenantDocSections}
          baseHref="/dashboard/docs"
          label="Tenant Docs"
        />
      </div>
      <div className="flex-1 p-6 md:p-8 min-h-[60vh]">
        <Outlet />
      </div>
    </div>
  </TenantPageShell>
);

export default TenantDocsLayout;
