import React from "react";
import { Shield } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import SecurityGroupsTable from "./SecurityGroupsTable";
import type { SecurityGroup } from "./types";
import type { SecurityGroupPermissions } from "../../config/permissionPresets";

interface SecurityGroupsOverviewProps {
  securityGroups: SecurityGroup[];
  isLoading?: boolean;
  emptyMessage?: string;
  onViewRules?: (sg: SecurityGroup) => void;
  onDelete?: (sg: SecurityGroup) => void;
  showActions?: boolean;
  /** Optional permissions object for permission-based action gating */
  permissions?: SecurityGroupPermissions;
}

const SecurityGroupsOverview: React.FC<SecurityGroupsOverviewProps> = ({
  securityGroups,
  isLoading = false,
  emptyMessage,
  onViewRules,
  onDelete,
  showActions,
  permissions,
}) => {
  // Determine actions visibility based on permissions or legacy showActions prop
  const shouldShowActions = showActions ?? Boolean(onViewRules || onDelete);

  // If permissions are provided, gate handlers based on them
  const effectiveOnViewRules = permissions?.canViewRules === false ? undefined : onViewRules;
  const effectiveOnDelete = permissions?.canDelete === false ? undefined : onDelete;

  return (
    <div className="space-y-6">
      <ModernCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{securityGroups.length}</div>
            <div className="text-sm text-gray-500 font-medium">Total Security Groups</div>
          </div>
        </div>
      </ModernCard>

      <SecurityGroupsTable
        securityGroups={securityGroups}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        onViewRules={effectiveOnViewRules}
        onDelete={effectiveOnDelete}
        showActions={shouldShowActions}
      />
    </div>
  );
};

export default SecurityGroupsOverview;
