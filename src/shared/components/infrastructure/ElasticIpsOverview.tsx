import React from "react";
import { Globe2, Link2, Unplug } from "lucide-react";
import ModernCard from "../ui/ModernCard";
import ElasticIpsTable from "./ElasticIpsTable";
import type { ElasticIp } from "./types";
import type { ElasticIpPermissions } from "../../config/permissionPresets";

interface ElasticIpsOverviewProps {
  elasticIps: ElasticIp[];
  isLoading?: boolean;
  emptyMessage?: string;
  onAssociate?: (eip: ElasticIp) => void;
  onDisassociate?: (eip: ElasticIp) => void;
  onRelease?: (eip: ElasticIp) => void;
  showActions?: boolean;
  /** Optional permissions object for permission-based action gating */
  permissions?: ElasticIpPermissions;
}

const ElasticIpsOverview: React.FC<ElasticIpsOverviewProps> = ({
  elasticIps,
  isLoading = false,
  emptyMessage,
  onAssociate,
  onDisassociate,
  onRelease,
  showActions,
  permissions,
}) => {
  const associatedCount = elasticIps.filter((eip) => eip.association_id).length;
  const availableCount = elasticIps.length - associatedCount;

  // Determine actions visibility based on permissions or legacy showActions prop
  const shouldShowActions = showActions ?? Boolean(onAssociate || onDisassociate || onRelease);

  // If permissions are provided, gate handlers based on them
  const effectiveOnAssociate = permissions?.canAssociate === false ? undefined : onAssociate;
  const effectiveOnDisassociate =
    permissions?.canDisassociate === false ? undefined : onDisassociate;
  const effectiveOnRelease = permissions?.canDelete === false ? undefined : onRelease;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{elasticIps.length}</div>
              <div className="text-sm text-gray-500">Total Elastic IPs</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Link2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{associatedCount}</div>
              <div className="text-sm text-gray-500">Associated</div>
            </div>
          </div>
        </ModernCard>
        <ModernCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Unplug className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{availableCount}</div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
          </div>
        </ModernCard>
      </div>

      <ElasticIpsTable
        elasticIps={elasticIps}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        onAssociate={effectiveOnAssociate}
        onDisassociate={effectiveOnDisassociate}
        onRelease={effectiveOnRelease}
        showActions={shouldShowActions}
      />
    </div>
  );
};

export default ElasticIpsOverview;
