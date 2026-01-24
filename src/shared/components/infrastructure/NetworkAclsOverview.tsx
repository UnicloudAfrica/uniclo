import React from "react";
import { ShieldCheck } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import NetworkAclsTable from "./NetworkAclsTable";
import type { NetworkAcl } from "./types";

interface NetworkAclsOverviewProps {
  networkAcls: NetworkAcl[];
  isLoading?: boolean;
  emptyMessage?: string;
  onDelete?: (acl: NetworkAcl) => void;
  onManageRules?: (acl: NetworkAcl) => void;
  showActions?: boolean;
}

const NetworkAclsOverview: React.FC<NetworkAclsOverviewProps> = ({
  networkAcls,
  isLoading = false,
  emptyMessage,
  onDelete,
  onManageRules,
  showActions,
}) => {
  const shouldShowActions = showActions ?? Boolean(onDelete || onManageRules);

  return (
    <div className="space-y-6">
      <ModernCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{networkAcls.length}</div>
            <div className="text-sm text-gray-500">Total Network ACLs</div>
          </div>
        </div>
      </ModernCard>

      <NetworkAclsTable
        networkAcls={networkAcls}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        onDelete={onDelete}
        onManageRules={onManageRules}
        showActions={shouldShowActions}
      />
    </div>
  );
};

export default NetworkAclsOverview;
