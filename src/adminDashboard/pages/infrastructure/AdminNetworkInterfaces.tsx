import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Cable } from "lucide-react";
import AdminHeadbar from "../../components/adminHeadbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminPageShell from "../../components/AdminPageShell";
import { NetworkInterfacesTable } from "../../../shared/components/infrastructure";
import { useFetchNetworkInterfaces } from "../../../hooks/adminHooks/networkHooks";

const AdminNetworkInterfaces: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const {
    data: networkInterfaces = [],
    isLoading,
    refetch,
  } = useFetchNetworkInterfaces(projectId, region);

  const breadcrumbs = [
    { label: "Home", href: "/admin-dashboard" },
    { label: "Infrastructure", href: "/admin-dashboard/projects" },
    { label: "Network Interfaces" },
  ];

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Network Interfaces"
        description="Virtual network cards attached to instances"
        icon={<Cable className="w-6 h-6 text-orange-500" />}
        breadcrumbs={breadcrumbs}
      >
        <NetworkInterfacesTable
          networkInterfaces={networkInterfaces}
          isLoading={isLoading}
          onRefresh={refetch}
        />
      </AdminPageShell>
    </>
  );
};

export default AdminNetworkInterfaces;
