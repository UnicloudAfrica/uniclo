import React from "react";
import { Server, Plus, Play, Square } from "lucide-react";

interface ComputeResourcesCardProps {
  totalInstances: number;
  runningInstances: number;
  stoppedInstances: number;
  onAddInstance: () => void;
  isLoading?: boolean;
}

const ComputeResourcesCard: React.FC<ComputeResourcesCardProps> = ({
  totalInstances = 0,
  runningInstances = 0,
  stoppedInstances = 0,
  onAddInstance,
  isLoading = false,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Server className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Compute Resources</h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{totalInstances}</div>
          <div className="text-sm text-gray-500">Instances</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Play className="w-4 h-4 text-green-500" />
            <span className="text-xl font-semibold text-gray-700">{runningInstances}</span>
          </div>
          <div className="text-sm text-gray-500">Running</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Square className="w-4 h-4 text-gray-400" />
            <span className="text-xl font-semibold text-gray-700">{stoppedInstances}</span>
          </div>
          <div className="text-sm text-gray-500">Stopped</div>
        </div>
      </div>

      {/* Add Instance Button */}
      <button
        type="button"
        onClick={onAddInstance}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        Add Instance
      </button>
    </div>
  );
};

export default ComputeResourcesCard;
