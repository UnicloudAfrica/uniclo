import AdminPageShell from "../components/AdminPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

export default function AdminShieldAnalytics() {
  return (
    <AdminPageShell
      title="Shield Analytics"
      description="Select a domain to view detailed analytics"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="admin"
        detailBasePath="/admin-dashboard/shield/domains"
      />
    </AdminPageShell>
  );
}
