// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Key } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import KeyPairsContainer from "../../shared/components/infrastructure/containers/KeyPairsContainer";
import {
  useFetchClientKeyPairs,
  useDeleteClientKeyPair,
  useSyncKeyPairs,
} from "../../hooks/clientHooks/keyPairsHook";

const ClientKeyPairs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const hooks = {
    useList: useFetchClientKeyPairs,
    useDelete: useDeleteClientKeyPair,
    useSync: useSyncKeyPairs, // Generic sync handles context via ApiContext validation or passed headers, but context is key
  };

  return (
    <KeyPairsContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              Key Pairs
            </span>
          }
          description="Manage SSH key pairs for secure instance access"
          actions={headerActions}
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientKeyPairs;
