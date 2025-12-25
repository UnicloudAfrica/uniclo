import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import ClientPageShell from "../components/ClientPageShell";
import { StorageManagementContainer } from "../../shared/components/infrastructure/storage";

const ClientImages: React.FC = () => {
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
    <ClientPageShell title="Machine Images" description="Manage your machine images">
      <StorageManagementContainer projectId={projectId} region={region} initialTab="images" />
    </ClientPageShell>
  );
};

export default ClientImages;
