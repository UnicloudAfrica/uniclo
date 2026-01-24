import React from "react";
import { Globe, Network } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import NatGatewaysTable from "./NatGatewaysTable";
import type { NatGateway } from "./types";

interface NatGatewaysOverviewProps {
  natGateways: NatGateway[];
  isLoading?: boolean;
  emptyMessage?: string;
  availableSubnetsCount?: number;
  onDelete?: (nat: NatGateway) => void;
  showActions?: boolean;
}

const NatGatewaysOverview: React.FC<NatGatewaysOverviewProps> = ({
  natGateways,
  isLoading = false,
  emptyMessage,
  availableSubnetsCount,
  onDelete,
  showActions,
}) => {
  const availableCount = natGateways.filter((gateway) => gateway.state === "available").length;
  const shouldShowActions = showActions ?? Boolean(onDelete);
  const gridClassName =
    availableSubnetsCount === undefined
      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
      : "grid grid-cols-1 md:grid-cols-3 gap-4";

  return (
    <div className="space-y-6">
      <div className={gridClassName}>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{natGateways.length}</div>
              <div className="text-sm text-gray-500">Total NAT Gateways</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{availableCount}</div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
          </div>
        </ModernCard>
        {typeof availableSubnetsCount === "number" && (
          <ModernCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{availableSubnetsCount}</div>
                <div className="text-sm text-gray-500">Available Subnets</div>
              </div>
            </div>
          </ModernCard>
        )}
      </div>

      <NatGatewaysTable
        natGateways={natGateways}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        onDelete={onDelete}
        showActions={shouldShowActions}
      />
    </div>
  );
};

export default NatGatewaysOverview;
