import React from "react";
import { useSearchParams } from "react-router-dom";
import { Key } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import KeyPairsContainer, {
  KeyPairHooks,
} from "../../shared/components/infrastructure/containers/KeyPairsContainer";
import {
  useFetchClientKeyPairs,
  useDeleteClientKeyPair,
  useSyncKeyPairs,
} from "../../hooks/clientHooks/keyPairsHook";

const ClientKeyPairs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const hooks: KeyPairHooks = {
    useList: useFetchClientKeyPairs as KeyPairHooks["useList"],
    useDelete: useDeleteClientKeyPair as KeyPairHooks["useDelete"],
    useSync: useSyncKeyPairs as KeyPairHooks["useSync"],
  };

  return (
    <KeyPairsContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              Key Pairs
            </span>
          }
          description="Manage SSH key pairs for secure instance access"
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientKeyPairs;
