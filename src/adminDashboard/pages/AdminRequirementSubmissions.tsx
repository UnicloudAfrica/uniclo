import AdminPageShell from "../components/AdminPageShell";
import RequirementSubmissions from "@/shared/components/gate/RequirementSubmissions";

const AdminRequirementSubmissions = () => (
  <AdminPageShell
    title="Form submissions"
    description="Everything people have submitted against this form — kept immutably for audit."
    contentClassName="space-y-6"
  >
    <RequirementSubmissions basePath="/admin-dashboard/requirements" />
  </AdminPageShell>
);

export default AdminRequirementSubmissions;
