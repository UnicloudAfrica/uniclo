import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Settings, RefreshCw, Users, ExternalLink } from "lucide-react";

interface ProjectQuickActionsCardProps {
  projectId: string | number;
  projectIdentifier: string;
  onRefresh?: () => void;
  onManageMembers?: () => void;
  onOpenConsole?: () => void;
  isRefreshing?: boolean;
}

const ProjectQuickActionsCard: React.FC<ProjectQuickActionsCardProps> = ({
  projectId,
  projectIdentifier,
  onRefresh,
  onManageMembers,
  onOpenConsole,
  isRefreshing = false,
}) => {
  const navigate = useNavigate();

  const handleAddInstance = () => {
    // Navigate to create instance with project pre-selected
    navigate(`/admin-dashboard/create-instance?project=${projectIdentifier}`);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Primary Action - Add Instance */}
        <button
          onClick={handleAddInstance}
          className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Add Instance
        </button>

        {/* Secondary Actions */}
        {onManageMembers && (
          <button
            onClick={onManageMembers}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-4 h-4" />
            Members
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Sync
          </button>
        )}

        {onOpenConsole && (
          <button
            onClick={onOpenConsole}
            className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Zadara Console
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectQuickActionsCard;
