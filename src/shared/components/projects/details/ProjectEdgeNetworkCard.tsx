import React from "react";
import { Wifi, WifiOff, ExternalLink, Settings } from "lucide-react";

interface ProjectEdgeNetworkCardProps {
  isConnected?: boolean;
  edgeNetworkId?: string;
  edgeNetworkName?: string;
  onManage?: () => void;
  isLoading?: boolean;
}

const ProjectEdgeNetworkCard: React.FC<ProjectEdgeNetworkCardProps> = ({
  isConnected = false,
  edgeNetworkId,
  edgeNetworkName,
  onManage,
  isLoading = false,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Edge Network</h3>
        {onManage && (
          <button
            onClick={onManage}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Manage
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${isConnected ? "bg-green-100" : "bg-gray-100"}`}>
          {isConnected ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {isConnected ? "Connected" : "Not Connected"}
            </span>
          </div>
          {edgeNetworkName && <p className="text-sm text-gray-500 mt-1">{edgeNetworkName}</p>}
        </div>
      </div>

      {/* Edge Network ID */}
      {edgeNetworkId && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Network ID</p>
          <p className="text-sm font-mono text-gray-700 truncate" title={edgeNetworkId}>
            {edgeNetworkId}
          </p>
        </div>
      )}

      {/* Not connected state */}
      {!isConnected && !edgeNetworkId && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">
            Enable internet access to connect to edge network
          </p>
          {onManage && (
            <button
              onClick={onManage}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configure
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectEdgeNetworkCard;
