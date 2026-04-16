import { useParams } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import { ShieldDomainDetail } from "@/shared/components/shield";

export default function AdminShieldDomainDetail() {
  const { domainId } = useParams<{ domainId: string }>();

  return (
    <AdminPageShell
      title="Domain Details"
      description="View and manage domain protection"
      contentClassName="space-y-6"
    >
      <ShieldDomainDetail
        identifier={domainId || ""}
        backPath="/admin-dashboard/shield/domains"
        context="admin"
      />
    </AdminPageShell>
  );
}
