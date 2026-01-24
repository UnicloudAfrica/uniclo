// @ts-nocheck
import React from "react";
import { Cable, Server, Network } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import NetworkInterfacesTable, { type NetworkInterface } from "./NetworkInterfacesTable";
import type { NetworkInterfacePermissions } from "../../config/permissionPresets";

interface NetworkInterfacesOverviewProps {
  networkInterfaces: NetworkInterface[];
  isLoading?: boolean;
  permissions?: NetworkInterfacePermissions;
}

/**
 * Shared Network Interfaces overview with stats and table.
 */
const NetworkInterfacesOverview: React.FC<NetworkInterfacesOverviewProps> = ({
  networkInterfaces,
  isLoading = false,
  permissions,
}) => {
  const attachedCount = networkInterfaces.filter((eni) => eni.attachment?.instance_id).length;
  const availableCount = networkInterfaces.length - attachedCount;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Cable className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{networkInterfaces.length}</div>
              <div className="text-sm text-gray-500">Total Interfaces</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{attachedCount}</div>
              <div className="text-sm text-gray-500">Attached</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{availableCount}</div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
          </div>
        </ModernCard>
      </div>

      {/* Table */}
      <NetworkInterfacesTable networkInterfaces={networkInterfaces} isLoading={isLoading} />

      {/* Info Note */}
      <ModernCard className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Cable className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">About Network Interfaces</h4>
            <p className="text-sm text-blue-700 mt-1">
              Network interfaces (ENIs) are automatically created when you launch instances for the
              primary network connection. You can attach additional ENIs for multi-homed instances,
              failover capabilities, or to separate management and data traffic.
            </p>
          </div>
        </div>
      </ModernCard>
    </div>
  );
};

export default NetworkInterfacesOverview;
