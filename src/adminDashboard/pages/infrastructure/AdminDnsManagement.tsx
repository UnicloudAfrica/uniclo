import React from "react";
import { useSearchParams } from "react-router-dom";
import { Globe } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import DnsManagementContainer from "../../../shared/components/infrastructure/dns/DnsManagementContainer";

const AdminDnsManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  // Default to lagos-1 for admin view if not specified
  const region = searchParams.get("region") || "lagos-1";

  return (
    <>
      <AdminPageShell
        title="DNS Management"
        description="Manage global and regional DNS zones and records"
        icon={<Globe className="w-6 h-6 text-blue-600" />}
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Infrastructure", href: "/admin-dashboard/projects" },
          { label: "DNS Management" },
        ]}
      >
        <DnsManagementContainer projectId={projectId} region={region} />
      </AdminPageShell>
    </>
  );
};

export default AdminDnsManagement;
