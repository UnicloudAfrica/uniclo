import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TenantPageShell from "../../components/TenantPageShell";
import { AutoScalingManagementContainer } from "../../../shared/components/infrastructure/autoscaling";

const TenantAutoScaling: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  // Only provide create callbacks when project context is available
  const hasProjectContext = !!rawProjectId && !!region && rawProjectId !== "null";

  return (
    <TenantPageShell
      title="Auto-scaling"
      description="Manage auto-scaling groups and launch configurations"
    >
      <AutoScalingManagementContainer
        projectId={projectId}
        region={region}
        onCreateGroup={
          hasProjectContext
            ? () =>
                navigate(
                  `/dashboard/infrastructure/autoscaling/create-group?id=${rawProjectId}&region=${region}`
                )
            : undefined
        }
        onCreateLaunchConfig={
          hasProjectContext
            ? () =>
                navigate(
                  `/dashboard/infrastructure/autoscaling/create-config?id=${rawProjectId}&region=${region}`
                )
            : undefined
        }
      />
    </TenantPageShell>
  );
};

export default TenantAutoScaling;
