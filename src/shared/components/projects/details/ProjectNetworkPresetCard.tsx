import React from "react";
import { Globe, Lock, Layers, Database, Network, CheckCircle, Settings } from "lucide-react";

interface ProjectNetworkPresetCardProps {
  preset: string | null;
  vpcCount?: number;
  subnetCount?: number;
  securityGroupCount?: number;
  onChangePreset?: () => void;
  onViewDetails?: () => void;
  isLoading?: boolean;
}

const PRESET_INFO: Record<string, { name: string; icon: React.ReactNode; description: string }> = {
  standard: {
    name: "Standard",
    icon: <Globe className="w-5 h-5" />,
    description: "Public network with SSH, HTTP, HTTPS access",
  },
  private: {
    name: "Private",
    icon: <Lock className="w-5 h-5" />,
    description: "Internal network with no public access",
  },
  "multi-tier": {
    name: "Multi-Tier",
    icon: <Layers className="w-5 h-5" />,
    description: "Public and private subnets",
  },
  database: {
    name: "Database",
    icon: <Database className="w-5 h-5" />,
    description: "Optimized for database deployments",
  },
};

const ProjectNetworkPresetCard: React.FC<ProjectNetworkPresetCardProps> = ({
  preset,
  vpcCount = 0,
  subnetCount = 0,
  securityGroupCount = 0,
  onChangePreset,
  onViewDetails,
  isLoading = false,
}) => {
  const presetInfo = preset ? PRESET_INFO[preset] : null;
  const hasNetwork = vpcCount > 0 || subnetCount > 0;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-16 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Network Configuration</h3>
        </div>
        {hasNetwork && (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        )}
      </div>

      {/* Preset Info */}
      {presetInfo ? (
        <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg mb-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">{presetInfo.icon}</div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{presetInfo.name} Preset</p>
            <p className="text-sm text-gray-600">{presetInfo.description}</p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg mb-4 text-center">
          <p className="text-gray-500 text-sm">No network preset configured</p>
          <p className="text-xs text-gray-400 mt-1">
            Network was configured manually or not yet set up
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">{vpcCount}</p>
          <p className="text-xs text-gray-500">VPCs</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">{subnetCount}</p>
          <p className="text-xs text-gray-500">Subnets</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">{securityGroupCount}</p>
          <p className="text-xs text-gray-500">Security Groups</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Details
          </button>
        )}
        {onChangePreset && (
          <button
            onClick={onChangePreset}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {preset ? "Change Preset" : "Configure Network"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectNetworkPresetCard;
