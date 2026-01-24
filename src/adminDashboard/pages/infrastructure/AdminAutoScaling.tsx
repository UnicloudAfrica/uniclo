import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminPageShell from "../../components/AdminPageShell";
import { AutoScalingManagementContainer } from "../../../shared/components/infrastructure/autoscaling";

const AdminAutoScaling: React.FC = () => {
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
    <>
      <AdminPageShell
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
                    `/admin-dashboard/infrastructure/autoscaling/create-group?id=${rawProjectId}&region=${region}`
                  )
              : undefined
          }
          onCreateLaunchConfig={
            hasProjectContext
              ? () =>
                  navigate(
                    `/admin-dashboard/infrastructure/autoscaling/create-config?id=${rawProjectId}&region=${region}`
                  )
              : undefined
          }
        />
      </AdminPageShell>
    </>
  );
};

export default AdminAutoScaling;
