import React from "react";
import { Outlet } from "react-router-dom";
import ClientDocsSidebar from "./ClientDocsSidebar";

const ClientDocsLayout: React.FC = () => (
  <div className="flex min-h-[calc(100vh-64px)]">
    <ClientDocsSidebar />
    <div className="flex-1 overflow-y-auto p-6 md:p-8" style={{ backgroundColor: "var(--theme-surface-alt, #f9fafb)" }}>
      <Outlet />
    </div>
  </div>
);

export default ClientDocsLayout;
