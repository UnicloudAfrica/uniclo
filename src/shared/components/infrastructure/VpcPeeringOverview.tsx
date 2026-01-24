import React from "react";
import { GitMerge, Check, RefreshCw } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import VpcPeeringTable from "./VpcPeeringTable";
import type { VpcPeeringConnection, VpcPeeringStatus } from "./types";

interface VpcPeeringOverviewProps {
  peeringConnections: VpcPeeringConnection[];
  isLoading?: boolean;
  emptyMessage?: string;
  onAccept?: (pc: VpcPeeringConnection) => void;
  onReject?: (pc: VpcPeeringConnection) => void;
  onDelete?: (pc: VpcPeeringConnection) => void;
  showActions?: boolean;
}

const VpcPeeringOverview: React.FC<VpcPeeringOverviewProps> = ({
  peeringConnections,
  isLoading = false,
  emptyMessage,
  onAccept,
  onReject,
  onDelete,
  showActions,
}) => {
  const resolveStatus = (status?: string | VpcPeeringStatus) =>
    typeof status === "string" ? status : status?.code;

  const activeCount = peeringConnections.filter(
    (pc) => resolveStatus(pc.status)?.toLowerCase() === "active"
  ).length;
  const pendingCount = peeringConnections.filter(
    (pc) => resolveStatus(pc.status)?.toLowerCase() === "pending-acceptance"
  ).length;
  const shouldShowActions = showActions ?? Boolean(onAccept || onReject || onDelete);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <GitMerge className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{peeringConnections.length}</div>
              <div className="text-sm text-gray-500">Total Connections</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </div>
        </ModernCard>
      </div>

      <VpcPeeringTable
        peeringConnections={peeringConnections}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        onAccept={onAccept}
        onReject={onReject}
        onDelete={onDelete}
        showActions={shouldShowActions}
      />
    </div>
  );
};

export default VpcPeeringOverview;
