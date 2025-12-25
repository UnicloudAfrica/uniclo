import React from "react";
import { useSearchParams } from "react-router-dom";
import { Key } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import { KeyPairsTable } from "../../shared/components/infrastructure";
import {
  useFetchClientKeyPairs,
  useCreateClientKeyPair,
  useDeleteClientKeyPair,
} from "../../hooks/clientHooks/keyPairsHook";

const ClientKeyPairs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const { data: keyPairs = [], isLoading, refetch } = useFetchClientKeyPairs(projectId, region);
  const { mutateAsync: createKeyPair, isPending: isCreating } = useCreateClientKeyPair();
  const { mutate: deleteKeyPair, isPending: isDeleting } = useDeleteClientKeyPair();

  const handleCreate = async (name: string) => {
    const result = await createKeyPair({ project_id: projectId, region, name });
    refetch();
    return result?.data || result;
  };

  const handleDelete = (keyPairId: string, keyPairName: string) => {
    if (confirm(`Are you sure you want to delete key pair "${keyPairName}"?`)) {
      deleteKeyPair({ id: keyPairId, payload: { project_id: projectId } });
    }
  };

  return (
    <ClientPageShell
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
    </ClientPageShell>
  );
};

export default ClientKeyPairs;
