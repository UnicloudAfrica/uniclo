import AdminPageShell from "../components/AdminPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

export default function AdminShieldDomains() {
  return (
    <AdminPageShell
      title="Shield Domains"
      description="Manage all protected domains across the platform"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="admin"
        detailBasePath="/admin-dashboard/shield/domains"
      />
    </AdminPageShell>
  );
}
