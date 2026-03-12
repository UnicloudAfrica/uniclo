import React, { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { RefreshCw, RefreshCcw } from "lucide-react";
import NetworkInterfacesOverview from "../NetworkInterfacesOverview";
import ModernButton from "../../ui/ModernButton";
import { getNetworkInterfacePermissions, type Hierarchy } from "@/shared/config/permissionPresets";
import type { NetworkInterface } from "../NetworkInterfacesTable";

interface NetworkInterfaceHooks {
  useList: (
    projectId: string,
    region: string,
    options?: { enabled?: boolean }
  ) => UseQueryResult<NetworkInterface[], Error>;
  /** Optional sync function - triggers refresh/sync */
  onSync?: () => Promise<void>;
}

interface NetworkInterfacesContainerProps {
  hierarchy: Hierarchy;
  projectId: string;
  region: string;
  hooks: NetworkInterfaceHooks;
  wrapper: (props: {
    headerActions: React.ReactNode;
    children: React.ReactNode;
  }) => React.ReactElement<any>;
}

/**
 * Container component for Network Interfaces.
 * Handles:
 * - Data fetching via injected hooks
 * - Permission-based headers and sync
 * - View delegation to Overview component
 */
const NetworkInterfacesContainer: React.FC<NetworkInterfacesContainerProps> = ({
  hierarchy,
  projectId,
  region,
  hooks,
  wrapper: Wrapper,
}) => {
  const permissions = getNetworkInterfacePermissions(hierarchy);
  const [isSyncing, setIsSyncing] = useState(false);

  // Hook call
  const { data, isLoading, isFetching, refetch } = hooks.useList(projectId, region);
  const networkInterfaces = Array.isArray(data) ? data : [];

  const handleSync = async () => {
    if (!permissions.canSync || !hooks.onSync) return;
    setIsSyncing(true);
    try {
      await hooks.onSync();
      refetch();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  // Build header actions
  const headerActions = (
    <div className="flex items-center gap-3">
      {permissions.canSync && hooks.onSync && (
        <ModernButton variant="secondary" size="sm" onClick={handleSync} disabled={isSyncing}>
          <RefreshCcw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync from Provider"}
        </ModernButton>
      )}
      <ModernButton variant="secondary" size="sm" onClick={handleRefresh} disabled={isFetching}>
        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        {isFetching ? "Refreshing..." : "Refresh"}
      </ModernButton>
    </div>
  );

  return (
    <Wrapper headerActions={headerActions}>
      <NetworkInterfacesOverview
        networkInterfaces={networkInterfaces}
        isLoading={isLoading}
        permissions={permissions}
      />
    </Wrapper>
  );
};

export default NetworkInterfacesContainer;
export type { NetworkInterfaceHooks };
