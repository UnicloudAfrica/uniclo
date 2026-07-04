import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import ClientPageShell from "../components/ClientPageShell";
import { StorageManagementContainer } from "@/shared/components/infrastructure/storage";
import logger from "@/utils/logger";

const ClientSnapshots: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const rawProjectId = queryParams.get("id");

  const projectId = useMemo(() => {
    if (!rawProjectId) return "";
    try {
      return atob(rawProjectId);
    } catch (e) {
      // Not base64-encoded — fall back to the raw id (graceful degradation).
      logger.error("Failed to decode project id", rawProjectId, e);
      return rawProjectId;
    }
  }, [rawProjectId]);

  const region = queryParams.get("region") || "";

  return (
    <ClientPageShell title="Snapshots" description="Manage your volume snapshots">
      <StorageManagementContainer projectId={projectId} region={region} initialTab="snapshots" />
    </ClientPageShell>
  );
};

export default ClientSnapshots;
