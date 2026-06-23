import TenantPageShell from "../components/TenantPageShell";
import RequirementSubmissions from "@/shared/components/gate/RequirementSubmissions";

const TenantRequirementSubmissions = () => (
  <TenantPageShell
    title="Form submissions"
    description="Everything your clients have submitted against this form — kept immutably for audit."
    contentClassName="space-y-6"
  >
    <RequirementSubmissions basePath="/dashboard/requirements" />
  </TenantPageShell>
);

export default TenantRequirementSubmissions;
