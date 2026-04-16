import AdminPageShell from "../components/AdminPageShell";
import { ShieldDomainList } from "@/shared/components/shield";

export default function AdminShieldAttacks() {
  return (
    <AdminPageShell
      title="Shield Attacks"
      description="Select a domain to view its attack history"
      contentClassName="space-y-6"
    >
      <ShieldDomainList
        context="admin"
        detailBasePath="/admin-dashboard/shield/domains"
      />
    </AdminPageShell>
  );
}
