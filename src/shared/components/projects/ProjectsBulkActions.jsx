import React from "react";
import { Archive, PlayCircle, Trash2, Download, X } from "lucide-react";
import { ModernButton } from "../ui";

/**
 * Bulk actions toolbar for selected projects
 */
const ProjectsBulkActions = ({
  selectedCount,
  onClearSelection,
  onArchive,
  onActivate,
  onDelete,
  onExport,
}) => {
  return (
    <div className="sticky top-0 z-10 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} project{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="flex items-center gap-1 text-sm text-blue-600 transition hover:text-blue-700"
          >
            <X size={16} />
            Clear selection
          </button>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {onActivate && (
            <ModernButton
              onClick={onActivate}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <PlayCircle size={16} />
              Activate
            </ModernButton>
          )}

          {onArchive && (
            <ModernButton
              onClick={onArchive}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Archive size={16} />
              Archive
            </ModernButton>
          )}

          {onExport && (
            <ModernButton
              onClick={onExport}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </ModernButton>
          )}

          {onDelete && (
            <ModernButton
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </ModernButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsBulkActions;
