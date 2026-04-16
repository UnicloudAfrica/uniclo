import AdminPageShell from "../components/AdminPageShell";
import CloudAccountDetail from "@/shared/components/databases/CloudAccountDetail";

export default function AdminCloudAccountDetail() {
  return (
    <AdminPageShell
      title="Cloud Account"
      description="View and manage cloud account credentials"
      contentClassName="space-y-6"
    >
      <CloudAccountDetail listPath="/admin-dashboard/cloud-accounts" />
    </AdminPageShell>
  );
}
