// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Key } from "lucide-react";
import TenantPageShell from "../../../dashboard/components/TenantPageShell";
import KeyPairsContainer from "../../../shared/components/infrastructure/containers/KeyPairsContainer";
import {
  useFetchKeyPairs,
  useDeleteKeyPair,
  useSyncKeyPairs,
} from "../../../shared/hooks/keyPairsHooks";

const TenantKeyPairs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Tenants share generic hooks but permission presets will gate actions
  const hooks = {
    useList: useFetchKeyPairs,
    useDelete: useDeleteKeyPair,
    useSync: useSyncKeyPairs,
  };

  return (
    <KeyPairsContainer
      hierarchy="tenant"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <TenantPageShell
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
        </TenantPageShell>
      )}
    />
  );
};

export default TenantKeyPairs;
