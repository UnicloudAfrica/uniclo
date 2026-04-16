import React from "react";
import { Outlet } from "react-router-dom";
import ClientPageShell from "../../components/ClientPageShell";
import ConfigDocsSidebar from "@/docs/renderer/ConfigDocsSidebar";
import { clientDocSections } from "@/docs/config/clientDocs";

const ClientDocsLayout: React.FC = () => (
  <ClientPageShell title="Documentation" disableContentPadding>
    <div className="flex">
      <div className="sticky top-0 self-start h-[calc(100vh-140px)] overflow-y-auto">
        <ConfigDocsSidebar
          sections={clientDocSections}
          baseHref="/client-dashboard/docs"
          label="Client Docs"
        />
      </div>
      <div className="flex-1 p-6 md:p-8 min-h-[60vh]">
        <Outlet />
      </div>
    </div>
  </ClientPageShell>
);

export default ClientDocsLayout;
