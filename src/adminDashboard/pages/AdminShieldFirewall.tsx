import AdminPageShell from "../components/AdminPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

export default function AdminShieldFirewall() {
  return (
    <AdminPageShell
      title="Shield Firewall"
      description="Select a domain to manage its firewall rules"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="admin"
        detailBasePath="/admin-dashboard/shield/domains"
      />
    </AdminPageShell>
  );
}
