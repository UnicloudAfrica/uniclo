import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import { StorageManagementContainer } from "../../../shared/components/infrastructure/storage";

const TenantSnapshots: React.FC = () => {
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

  // Note: In a real scenario, we might want to pass the region from state or context
  // For now, we'll assume the container can handle it or it's passed via query params
  const region = queryParams.get("region") || "";

  return (
    <TenantPageShell title="Snapshots" description="Manage and restore your volume snapshots">
      <StorageManagementContainer projectId={projectId} region={region} />
    </TenantPageShell>
  );
};

export default TenantSnapshots;
