import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import { StorageManagementContainer } from "../../../shared/components/infrastructure/storage";

const TenantImages: React.FC = () => {
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
    <TenantPageShell
      title="Machine Images"
      description="Manage your custom bootable machine images"
    >
      {/* The container handles switching between snapshots and images, 
                but we can force it or just let the user toggle. 
                For a dedicated "Images" page, we might want to pass an initial tab prop if added later. */}
      <StorageManagementContainer projectId={projectId} region={region} />
    </TenantPageShell>
  );
};

export default TenantImages;
