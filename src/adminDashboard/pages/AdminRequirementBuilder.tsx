import { useParams } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import RequirementBuilder from "@/shared/components/gate/RequirementBuilder";

const BASE = "/admin-dashboard/requirements";

const AdminRequirementBuilder = () => {
  const { id } = useParams<{ id?: string }>();
  return (
    <AdminPageShell
      title={id ? "Edit form" : "Build a form"}
      description="Create the form people fill in. Every submission is recorded for audit."
      contentClassName="space-y-6"
    >
      <RequirementBuilder basePath={BASE} />
    </AdminPageShell>
  );
};

export default AdminRequirementBuilder;
