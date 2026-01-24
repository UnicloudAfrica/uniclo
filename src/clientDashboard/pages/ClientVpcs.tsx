// @ts-nocheck
import React from "react";
import { useSearchParams } from "react-router-dom";
import { Network } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import VpcsContainer from "../../shared/components/infrastructure/containers/VpcsContainer";
import { useVpcs, useCreateVpc, useDeleteVpc } from "../../shared/hooks/vpcInfraHooks";
import { syncClientVpcsFromProvider } from "../../hooks/clientHooks/vpcHooks";
import ToastUtils from "../../utils/toastUtil";

/**
 * Client VPCs page - thin wrapper with sync capability.
 * NO HOOKS CALLED HERE - all state managed by VpcsContainer.
 * Client can create, delete, and sync VPCs from provider.
 */
const ClientVpcs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const region = searchParams.get("region") || "";

  // Hook references passed to container (not called here)
  const hooks = {
    useList: useVpcs,
    useCreate: useCreateVpc,
    useDelete: useDeleteVpc,
    // Sync function for client - syncs VPCs from cloud provider
    // Container's refetch() is called after this completes
    onSync: async () => {
      if (!projectId || !region) {
        ToastUtils.error("Project and region required for sync");
        throw new Error("Missing project/region");
      }
      await syncClientVpcsFromProvider({ project_id: projectId, region });
      ToastUtils.success("VPCs synced successfully");
    },
  };

  return (
    <VpcsContainer
      hierarchy="client"
      projectId={projectId}
      region={region}
      hooks={hooks}
      wrapper={({ headerActions, children }) => (
        <ClientPageShell
          title={
            <span className="flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-600" />
              VPCs
            </span>
          }
          description="Virtual Private Clouds for your project"
          actions={headerActions}
        >
          {children}
        </ClientPageShell>
      )}
    />
  );
};

export default ClientVpcs;
