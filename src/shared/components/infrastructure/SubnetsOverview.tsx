import React from "react";
import { Network } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import SubnetsTable from "./SubnetsTable";
import type { Subnet } from "./types";
import type { SubnetPermissions } from "../../config/permissionPresets";

interface SubnetsOverviewProps {
  subnets: Subnet[];
  isLoading?: boolean;
  emptyMessage?: string;
  showVpcColumn?: boolean;
  showDefaultBadge?: boolean;
  showDefaultStats?: boolean;
  onDelete?: (subnet: Subnet) => void;
  showActions?: boolean;
  /** Optional permissions object for permission-based action and display gating */
  permissions?: SubnetPermissions;
}

const SubnetsOverview: React.FC<SubnetsOverviewProps> = ({
  subnets,
  isLoading = false,
  emptyMessage,
  showVpcColumn,
  showDefaultBadge,
  showDefaultStats,
  onDelete,
  showActions,
  permissions,
}) => {
  const defaultCount = subnets.filter((subnet) => subnet.is_default).length;

  // Determine actions visibility based on permissions or legacy showActions prop
  const shouldShowActions = showActions ?? Boolean(onDelete);

  // If permissions are provided, use them for display flags (fallback to props)
  const effectiveShowVpcColumn = permissions?.showVpcColumn ?? showVpcColumn ?? true;
  const effectiveShowDefaultBadge = permissions?.showDefaultBadge ?? showDefaultBadge ?? false;
  const effectiveShowDefaultStats = permissions?.showDefaultStats ?? showDefaultStats ?? false;
  const effectiveOnDelete = permissions?.canDelete === false ? undefined : onDelete;

  const gridClassName = effectiveShowDefaultStats
    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
    : "grid grid-cols-1 gap-4";

  return (
    <div className="space-y-6">
      <div className={gridClassName}>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{subnets.length}</div>
              <div className="text-sm text-gray-500 font-medium">Total Subnets</div>
            </div>
          </div>
        </ModernCard>
        {effectiveShowDefaultStats && (
          <ModernCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{defaultCount}</div>
                <div className="text-sm text-gray-500 font-medium">Default Subnets</div>
              </div>
            </div>
          </ModernCard>
        )}
      </div>

      <SubnetsTable
        subnets={subnets}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        showVpcColumn={effectiveShowVpcColumn}
        showDefaultBadge={effectiveShowDefaultBadge}
        onDelete={effectiveOnDelete}
        showActions={shouldShowActions}
      />
    </div>
  );
};

export default SubnetsOverview;
