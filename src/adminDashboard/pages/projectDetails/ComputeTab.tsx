import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFetchPurchasedInstances } from "../../../hooks/adminHooks/instancesHook";
import {
  useFetchKeyPairs,
  useSyncKeyPairs,
  useDeleteKeyPair,
} from "../../../hooks/adminHooks/keyPairHooks";
import ProjectComputeTab from "../../../shared/components/projects/details/ProjectComputeTab";

interface ComputeTabProps {
  project: any;
  initialSubView?: "instances" | "keypairs";
  onSubViewChange?: (subView: "instances" | "keypairs") => void;
}

const ComputeTab: React.FC<ComputeTabProps> = ({ project, initialSubView, onSubViewChange }) => {
  const [activeSubView, setActiveSubView] = useState<"instances" | "keypairs">(
    initialSubView || "instances"
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (initialSubView && initialSubView !== activeSubView) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView, activeSubView]);

  const handleSubViewChange = (nextView: "instances" | "keypairs") => {
    setActiveSubView(nextView);
    onSubViewChange?.(nextView);
  };

  return (
    <ProjectComputeTab
      projectId={project?.identifier}
      region={project?.region}
      hierarchy="admin"
      useInstances={useFetchPurchasedInstances}
      keyPairHooks={{
        useList: useFetchKeyPairs,
        useSync: useSyncKeyPairs,
        useDelete: useDeleteKeyPair,
      }}
      initialSubView={activeSubView}
      onSubViewChange={handleSubViewChange}
      onProvisionInstance={() =>
        navigate(
          `/admin-dashboard/create-instance?project=${encodeURIComponent(
            project?.identifier || ""
          )}`
        )
      }
    />
  );
};

export default ComputeTab;
