import React from "react";
import { Outlet } from "react-router-dom";
import AdminPageShell from "../../components/AdminPageShell";
import ConfigDocsSidebar from "@/docs/renderer/ConfigDocsSidebar";
import { adminDocSections } from "@/docs/config/adminDocs";

const AdminDocsLayout: React.FC = () => (
  <AdminPageShell title="Documentation" disableContentPadding>
    <div className="flex">
      <div className="sticky top-0 self-start h-[calc(100vh-140px)] overflow-y-auto">
        <ConfigDocsSidebar
          sections={adminDocSections}
          baseHref="/admin-dashboard/docs"
          label="Admin Docs"
          showEditor
        />
      </div>
      <div className="flex-1 p-6 md:p-8 min-h-[60vh]">
        <Outlet />
      </div>
    </div>
  </AdminPageShell>
);

export default AdminDocsLayout;
