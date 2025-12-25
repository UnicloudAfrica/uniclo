import React from "react";
import { useSearchParams } from "react-router-dom";
import { Key } from "lucide-react";
import TenantPageShell from "../../../dashboard/components/TenantPageShell";
import { KeyPairsTable } from "../../../shared/components/infrastructure";
import {
  useFetchTenantKeyPairs,
  useCreateTenantKeyPair,
  useDeleteTenantKeyPair,
} from "../../../hooks/keyPairsHook";

const TenantKeyPairs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const { data: keyPairs = [], isLoading, refetch } = useFetchTenantKeyPairs(projectId, region);
  const { mutateAsync: createKeyPair, isPending: isCreating } = useCreateTenantKeyPair();
  const { mutate: deleteKeyPair, isPending: isDeleting } = useDeleteTenantKeyPair();

  const handleCreate = async (name: string) => {
    const result = await createKeyPair({ project_id: projectId, region, name });
    refetch();
    return result?.data || result;
  };

  const handleDelete = (keyPairId: string, keyPairName: string) => {
    if (confirm(`Are you sure you want to delete key pair "${keyPairName}"?`)) {
      deleteKeyPair(keyPairId);
    }
  };

  return (
    <TenantPageShell
      title={
        <span className="flex items-center gap-2">
          <Key className="w-5 h-5 text-purple-600" />
          Key Pairs
        </span>
      }
      description="Manage SSH key pairs for secure instance access"
    >
      <KeyPairsTable
        keyPairs={keyPairs}
        isLoading={isLoading}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onRefresh={refetch}
        isCreating={isCreating}
        isDeleting={isDeleting}
      />
    </TenantPageShell>
  );
};

export default TenantKeyPairs;
