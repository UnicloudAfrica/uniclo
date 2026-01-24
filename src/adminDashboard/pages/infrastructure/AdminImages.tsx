import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import AdminPageShell from "../../components/AdminPageShell";
import { StorageManagementContainer } from "../../../shared/components/infrastructure/storage";

const AdminImages: React.FC = () => {
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
      <AdminPageShell title="Machine Images" description="Manage machine images across all tenants">
        <StorageManagementContainer projectId={projectId} region={region} initialTab="images" />
      </AdminPageShell>
    </>
  );
};

export default AdminImages;
