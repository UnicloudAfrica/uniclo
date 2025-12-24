import React from "react";
import { Network, Globe, Layers, Shield, CheckCircle, AlertCircle, Settings } from "lucide-react";

interface NetworkStatus {
  vpc: {
    configured: boolean;
    id?: string;
    name?: string;
  };
  internet_gateway: {
    configured: boolean;
    can_enable: boolean;
  };
  subnets: {
    configured: boolean;
    can_add: boolean;
  };
  security_groups: {
    configured: boolean;
    can_add: boolean;
  };
}

interface ProjectNetworkResourcesCardProps {
  networkStatus?: NetworkStatus | null;
  vpcCount?: number;
  subnetCount?: number;
  securityGroupCount?: number;
  onViewDetails?: () => void;
  onConfigureNetwork?: () => void;
  onEnableInternet?: () => void;
  isLoading?: boolean;
}

const ProjectNetworkResourcesCard: React.FC<ProjectNetworkResourcesCardProps> = ({
  networkStatus,
  vpcCount = 0,
  subnetCount = 0,
  securityGroupCount = 0,
  onViewDetails,
  onConfigureNetwork,
  onEnableInternet,
  isLoading = false,
}) => {
  const hasInternetGateway = networkStatus?.internet_gateway?.configured ?? false;
  const canEnableInternet = networkStatus?.internet_gateway?.can_enable ?? false;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Network Resources</h3>
        </div>
        {onConfigureNetwork && (
          <button
            onClick={onConfigureNetwork}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Configure Network"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{vpcCount}</div>
          <div className="text-xs text-gray-500">VPCs</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{subnetCount}</div>
          <div className="text-xs text-gray-500">Subnets</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{securityGroupCount}</div>
          <div className="text-xs text-gray-500">Security Groups</div>
        </div>
      </div>

      {/* Internet Gateway Status */}
      <div className="flex items-center justify-between py-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">Internet Gateway</span>
        </div>
        {hasInternetGateway ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <AlertCircle className="w-3 h-3" />
            Not Configured
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Details
          </button>
        )}
        {!hasInternetGateway && canEnableInternet && onEnableInternet ? (
          <button
            onClick={onEnableInternet}
            className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Globe className="w-4 h-4" />
            Enable Internet
          </button>
        ) : onConfigureNetwork ? (
          <button
            onClick={onConfigureNetwork}
            className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Configure
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ProjectNetworkResourcesCard;
