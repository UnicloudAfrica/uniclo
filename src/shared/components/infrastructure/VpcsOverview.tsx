// @ts-nocheck
import React from "react";
import { Network } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import VpcsTable, { type Vpc } from "./VpcsTable";
import type { VpcPermissions } from "../../config/permissionPresets";

interface VpcsOverviewProps {
  vpcs: Vpc[];
  isLoading?: boolean;
  emptyMessage?: string;
  onDelete?: (vpc: Vpc) => void;
  showActions?: boolean;
  /** Optional permissions object for permission-based action and display gating */
  permissions?: VpcPermissions;
}

/**
 * Shared VPCs overview component with stats card and table.
 */
const VpcsOverview: React.FC<VpcsOverviewProps> = ({
  vpcs,
  isLoading = false,
  emptyMessage,
  onDelete,
  showActions,
  permissions,
}) => {
  const defaultCount = vpcs.filter((vpc) => vpc.is_default).length;
  const healthyCount = vpcs.filter(
    (vpc) => (vpc.state || vpc.status)?.toLowerCase() === "available"
  ).length;

  // Determine actions visibility based on permissions or legacy showActions prop
  const shouldShowActions = showActions ?? Boolean(onDelete);

  // Gate handlers based on permissions
  const effectiveOnDelete = permissions?.canDelete === false ? undefined : onDelete;
  const effectiveShowDefaultBadge = permissions?.showDefaultBadge ?? true;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{vpcs.length}</div>
              <div className="text-sm text-gray-500 font-medium">Total VPCs</div>
            </div>
          </div>
        </ModernCard>

        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{healthyCount}</div>
              <div className="text-sm text-gray-500 font-medium">Available</div>
            </div>
          </div>
        </ModernCard>

        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{defaultCount}</div>
              <div className="text-sm text-gray-500 font-medium">Default VPCs</div>
            </div>
          </div>
        </ModernCard>
      </div>

      {/* Table */}
      <VpcsTable
        vpcs={vpcs}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        onDelete={effectiveOnDelete}
        showDefaultBadge={effectiveShowDefaultBadge}
        showActions={shouldShowActions}
      />
    </div>
  );
};

export default VpcsOverview;
