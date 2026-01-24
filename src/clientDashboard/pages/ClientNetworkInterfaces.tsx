// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Cable } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import NetworkInterfacesContainer from "../../shared/components/infrastructure/containers/NetworkInterfacesContainer";
import {
  useFetchClientNetworkInterfaces,
  syncClientNetworkInterfacesFromProvider,
} from "../../hooks/clientHooks/networkHooks";
import ToastUtils from "../../utils/toastUtil";

/**
 * Client Network Interfaces - thin wrapper.
 * Can view and sync network interfaces.
 */
const ClientNetworkInterfaces: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  const hooks = {
    useList: useFetchClientNetworkInterfaces,
    onSync: async () => {
      await syncClientNetworkInterfacesFromProvider({ project_id: projectId, region });
      ToastUtils.success("Network Interfaces synced from provider");
    },
  };

  return (
    <NetworkInterfacesContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <Cable className="w-5 h-5 text-orange-500" />
              Network Interfaces
            </span>
          }
          description="Virtual network cards attached to instances"
          actions={headerActions}
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientNetworkInterfaces;
