import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Key } from "lucide-react";
import AdminHeadbar from "../../components/adminHeadbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminPageShell from "../../components/AdminPageShell";
import { KeyPairsTable } from "../../../shared/components/infrastructure";
import { useFetchKeyPairs, useDeleteKeyPair } from "../../../hooks/adminHooks/keyPairHooks";

const AdminKeyPairs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const { data: keyPairs = [], isLoading, refetch } = useFetchKeyPairs(projectId, region);
  const { mutate: deleteKeyPair, isPending: isDeleting } = useDeleteKeyPair();

  const handleCreateClick = () => {
    navigate("/admin-dashboard/key-pairs/create");
  };

  const handleDelete = (keyPairId: string, keyPairName: string) => {
    if (confirm(`Are you sure you want to delete key pair "${keyPairName}"?`)) {
      deleteKeyPair({ projectId, region, keyPairId });
    }
  };

  const breadcrumbs = [
    { label: "Home", href: "/admin-dashboard" },
    { label: "Infrastructure", href: "/admin-dashboard/projects" },
    { label: "Key Pairs" },
  ];

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Key Pairs"
        description="Manage SSH key pairs for secure instance access"
        icon={<Key className="w-6 h-6 text-purple-600" />}
        breadcrumbs={breadcrumbs}
      >
        <KeyPairsTable
          keyPairs={keyPairs}
          isLoading={isLoading}
          onCreate={handleCreateClick}
          onDelete={handleDelete}
          onRefresh={refetch}
          isDeleting={isDeleting}
        />
      </AdminPageShell>
    </>
  );
};

export default AdminKeyPairs;
