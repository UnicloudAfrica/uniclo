import AdminPageShell from "../components/AdminPageShell";
import CloudAccountCreateForm from "@/shared/components/databases/CloudAccountCreateForm";

export default function AdminCloudAccountCreate() {
  return (
    <AdminPageShell
      title="Connect Cloud Account"
      description="Add cloud provider credentials for BYOC database deployments"
      contentClassName="space-y-6"
    >
      <CloudAccountCreateForm listPath="/admin-dashboard/cloud-accounts" />
    </AdminPageShell>
  );
}
