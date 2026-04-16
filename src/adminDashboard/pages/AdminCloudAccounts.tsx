import AdminPageShell from "../components/AdminPageShell";
import CloudAccountList from "@/shared/components/databases/CloudAccountList";

export default function AdminCloudAccounts() {
  return (
    <AdminPageShell
      title="Cloud Accounts"
      description="Manage all tenant cloud provider credentials (BYOC)"
      contentClassName="space-y-6"
    >
      <CloudAccountList
        context="admin"
        createPath="/admin-dashboard/cloud-accounts/create"
      />
    </AdminPageShell>
  );
}
