import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "@/shared/components/ui";
import CreateProjectForm from "@/shared/components/projects/CreateProjectForm";

const AdminProjectCreate = () => {
  const navigate = useNavigate();
  const goBack = () => navigate("/admin-dashboard/projects");

  return (
    <AdminPageShell
      title="Create Project"
      description="Spin up a new workspace, assign a scope, and invite the right operators."
      actions={
        <ModernButton variant="outline" onClick={goBack}>
          Back to Projects
        </ModernButton>
      }
      contentClassName="space-y-6"
    >
      <CreateProjectForm mode="page" onClose={goBack} />
    </AdminPageShell>
  );
};

export default AdminProjectCreate;
