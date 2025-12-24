import React from "react";
import {
  Network,
  Globe,
  Shield,
  Layers,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface IGWDetails {
  id?: string;
  name?: string;
  external_id?: string;
  state?: string;
  created_at?: string;
}

interface NetworkConfigurationCardProps {
  vpcCount: number;
  subnetCount: number;
  securityGroupCount: number;
  hasInternetGateway: boolean;
  igwDetails?: IGWDetails | null;
  onEnableInternet: () => void;
  onViewDetails?: () => void;
  isEnabling?: boolean;
}

const NetworkConfigurationCard: React.FC<NetworkConfigurationCardProps> = ({
  vpcCount = 0,
  subnetCount = 0,
  securityGroupCount = 0,
  hasInternetGateway = false,
  igwDetails = null,
  onEnableInternet,
  onViewDetails,
  isEnabling = false,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Network className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Network Configuration</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <Layers className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-gray-900">{vpcCount}</div>
          <div className="text-xs text-gray-500">VPC</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <Network className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-gray-900">{subnetCount}</div>
          <div className="text-xs text-gray-500">Subnets</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <Shield className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-gray-900">{securityGroupCount}</div>
          <div className="text-xs text-gray-500">Security Groups</div>
        </div>
      </div>

      {/* Internet Gateway Status */}
      <div
        className={`py-3 px-3 rounded-lg mb-4 ${hasInternetGateway ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe
              className={`w-4 h-4 ${hasInternetGateway ? "text-green-600" : "text-gray-500"}`}
            />
            <span className="text-sm font-medium text-gray-700">Internet Gateway</span>
          </div>
          {hasInternetGateway ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
              <AlertCircle className="w-3.5 h-3.5" />
              Not Configured
            </span>
          )}
        </div>
        {/* Show IGW details when configured */}
        {hasInternetGateway && igwDetails && (
          <div className="mt-2 pt-2 border-t border-green-200 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>
                Name:{" "}
                <span className="font-medium text-gray-800">
                  {igwDetails.name || "Internet Gateway"}
                </span>
              </span>
              {igwDetails.state && (
                <span className="text-green-600 font-medium">{igwDetails.state}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      {!hasInternetGateway ? (
        <button
          type="button"
          onClick={onEnableInternet}
          disabled={isEnabling}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Globe className="w-4 h-4" />
          {isEnabling ? "Enabling..." : "Enable Internet"}
        </button>
      ) : onViewDetails ? (
        <button
          type="button"
          onClick={onViewDetails}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          View Network Details
        </button>
      ) : null}
    </div>
  );
};

export default NetworkConfigurationCard;
