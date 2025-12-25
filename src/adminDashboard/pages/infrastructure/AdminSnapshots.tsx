import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import AdminPageShell from "../../components/AdminPageShell";
import AdminHeadbar from "../../components/adminHeadbar";
import AdminSidebar from "../../components/AdminSidebar";
import { StorageManagementContainer } from "../../../shared/components/infrastructure/storage";

const AdminSnapshots: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const rawProjectId = queryParams.get("id");

  const projectId = useMemo(() => {
    if (!rawProjectId) return "";
    try {
      return atob(rawProjectId);
    } catch (e) {
      return rawProjectId;
    }
  }, [rawProjectId]);

  const region = queryParams.get("region") || "";

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell title="Snapshots" description="Manage volume snapshots across all tenants">
        <StorageManagementContainer projectId={projectId} region={region} initialTab="snapshots" />
      </AdminPageShell>
    </>
  );
};

export default AdminSnapshots;
