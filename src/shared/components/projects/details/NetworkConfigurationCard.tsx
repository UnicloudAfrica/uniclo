import React from "react";
import {
  Network,
  Globe,
  Shield,
  Layers,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Server,
  Wifi,
} from "lucide-react";

interface IGWDetails {
  id?: string;
  name?: string;
  external_id?: string;
  state?: string;
  created_at?: string;
}

interface NetworkConfigurationCardProps {
  provider?: string;
  vpcCount: number;
  subnetCount: number;
  securityGroupCount: number;
  hasInternetGateway: boolean;
  igwDetails?: IGWDetails | null;
  onEnableInternet: () => void;
  onViewDetails?: () => void;
  isEnabling?: boolean;
  /** Instance count — used for Nobus view */
  instanceCount?: number;
  /** Floating IP count — used for Nobus view */
  floatingIpCount?: number;
  /** Navigate to compute tab — used for Nobus view */
  onViewCompute?: () => void;
}

const NetworkConfigurationCard: React.FC<NetworkConfigurationCardProps> = ({
  provider,
  vpcCount = 0,
  subnetCount = 0,
  securityGroupCount = 0,
  hasInternetGateway = false,
  igwDetails = null,
  onEnableInternet,
  onViewDetails,
  isEnabling = false,
  instanceCount = 0,
  floatingIpCount = 0,
  onViewCompute,
}) => {
  const isNobus = provider?.toLowerCase() === "nobus";

  /* ------------------------------------------------------------------ */
  /* Nobus Layout — "Security & Access"                                  */
  /* Shows Instances / Security Groups / Floating IPs instead of VPC/IGW */
  /* ------------------------------------------------------------------ */
  if (isNobus) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm h-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Shield className="w-5 h-5 text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Security &amp; Access</h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center">
            <Server className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <div className="text-lg md:text-xl font-bold text-gray-900">{instanceCount}</div>
            <div className="text-xs text-gray-500">Instances</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center">
            <Shield className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <div className="text-lg md:text-xl font-bold text-gray-900">{securityGroupCount}</div>
            <div className="text-xs text-gray-500">Security Groups</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center">
            <Wifi className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <div className="text-lg md:text-xl font-bold text-gray-900">{floatingIpCount}</div>
            <div className="text-xs text-gray-500">Floating IPs</div>
          </div>
        </div>

        {/* Floating IP Status */}
        <div
          className={`py-3 px-3 rounded-lg mb-4 ${floatingIpCount > 0 ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe
                className={`w-4 h-4 ${floatingIpCount > 0 ? "text-green-600" : "text-gray-500"}`}
              />
              <span className="text-sm font-medium text-gray-700">Public Access</span>
            </div>
            {floatingIpCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                {floatingIpCount} Floating IP{floatingIpCount !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600">
                <AlertCircle className="w-3.5 h-3.5" />
                No Floating IPs
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        {onViewCompute && (
          <button
            type="button"
            onClick={onViewCompute}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            View Compute Resources
          </button>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Zadara / Default Layout — "Network Configuration"                   */
  /* Shows VPC / Subnet / Security Groups + Internet Gateway status      */
  /* ------------------------------------------------------------------ */
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Network className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Network Configuration</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
        <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center">
          <Layers className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <div className="text-lg md:text-xl font-bold text-gray-900">{vpcCount}</div>
          <div className="text-xs text-gray-500">VPC</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center">
          <Network className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <div className="text-lg md:text-xl font-bold text-gray-900">{subnetCount}</div>
          <div className="text-xs text-gray-500">Subnets</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-center">
          <Shield className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <div className="text-lg md:text-xl font-bold text-gray-900">{securityGroupCount}</div>
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
          disabled={isEnabling || vpcCount === 0}
          title={vpcCount === 0 ? "VPC required before enabling internet gateway" : ""}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Globe className="w-4 h-4" />
          {isEnabling ? "Enabling..." : vpcCount === 0 ? "VPC Required First" : "Enable Internet"}
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
