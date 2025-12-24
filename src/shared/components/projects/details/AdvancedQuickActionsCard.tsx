import React from "react";
import { Users, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface AdvancedQuickActionsCardProps {
  onManageMembers: () => void;
  onSyncResources: () => void;
  edgeNetworkConnected: boolean;
  edgeNetworkName?: string;
  isSyncing?: boolean;
}

const AdvancedQuickActionsCard: React.FC<AdvancedQuickActionsCardProps> = ({
  onManageMembers,
  onSyncResources,
  edgeNetworkConnected = false,
  edgeNetworkName,
  isSyncing = false,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={onManageMembers}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-left cursor-pointer"
        >
          <Users className="w-5 h-5 text-gray-500" />
          <span className="font-medium">Manage Members</span>
        </button>

        <button
          type="button"
          onClick={onSyncResources}
          disabled={isSyncing}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-left disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-5 h-5 text-gray-500 ${isSyncing ? "animate-spin" : ""}`} />
          <span className="font-medium">{isSyncing ? "Syncing..." : "Sync Resources"}</span>
        </button>
      </div>

      {/* Edge Network Status */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {edgeNetworkConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">Edge Network</span>
          </div>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              edgeNetworkConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {edgeNetworkConnected ? "Connected" : "Not Connected"}
          </span>
        </div>
        {edgeNetworkName && <p className="text-xs text-gray-500 mt-1 ml-6">{edgeNetworkName}</p>}
      </div>
    </div>
  );
};

export default AdvancedQuickActionsCard;
