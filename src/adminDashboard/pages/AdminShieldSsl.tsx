import AdminPageShell from "../components/AdminPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

export default function AdminShieldSsl() {
  return (
    <AdminPageShell
      title="Shield SSL"
      description="Select a domain to manage its SSL certificates"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="admin"
        detailBasePath="/admin-dashboard/shield/domains"
      />
    </AdminPageShell>
  );
}
