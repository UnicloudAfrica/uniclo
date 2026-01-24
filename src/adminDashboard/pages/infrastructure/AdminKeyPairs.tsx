// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Key } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import KeyPairsContainer from "../../../shared/components/infrastructure/containers/KeyPairsContainer";
import {
  useFetchKeyPairs,
  useDeleteKeyPair,
  useSyncKeyPairs,
} from "../../../shared/hooks/keyPairsHooks";

const AdminKeyPairs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const hooks = {
    useList: useFetchKeyPairs,
    useDelete: useDeleteKeyPair,
    useSync: useSyncKeyPairs,
  };

  return (
    <>
      <KeyPairsContainer
        hierarchy="admin"
        projectId={projectId}
        region={region}
        hooks={hooks}
        wrapper={({ headerActions, children }) => (
          <AdminPageShell
            title="Key Pairs"
            description="Manage SSH key pairs for secure instance access"
            icon={<Key className="w-6 h-6 text-purple-600" />}
            breadcrumbs={[
              { label: "Home", href: "/admin-dashboard" },
              { label: "Infrastructure", href: "/admin-dashboard/projects" },
              { label: "Key Pairs" },
            ]}
            actions={headerActions}
          >
            {children}
          </AdminPageShell>
        )}
      />
    </>
  );
};

export default AdminKeyPairs;
