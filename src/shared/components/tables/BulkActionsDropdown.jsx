import React, { useState } from "react";
import {
  Download,
  Copy,
  Archive,
  ArchiveRestore,
  Trash2,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

/**
 * Reusable BulkActionsDropdown component
 *
 * @param {Object} props
 * @param {number} props.selectedCount - Number of selected items
 * @param {Array} props.actions - Array of action configurations
 * @param {string} props.className - Additional CSS classes
 */
const BulkActionsDropdown = ({ selectedCount = 0, actions = [], className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const defaultActions = [
    {
      key: "export-csv",
      label: "Export as CSV",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      variant: "default",
    },
    {
      key: "export-excel",
      label: "Export as Excel",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      variant: "default",
    },
    {
      key: "export-pdf",
      label: "Export as PDF",
      icon: <FileText className="h-4 w-4" />,
      variant: "default",
    },
    {
      key: "duplicate",
      label: "Duplicate",
      icon: <Copy className="h-4 w-4" />,
      variant: "default",
    },
    {
      key: "archive",
      label: "Archive",
      icon: <Archive className="h-4 w-4" />,
      variant: "default",
    },
    {
      key: "unarchive",
      label: "Unarchive",
      icon: <ArchiveRestore className="h-4 w-4" />,
      variant: "default",
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "danger",
    },
  ];

  const mergedActions = actions.length > 0 ? actions : defaultActions;

  const handleActionClick = (action) => {
    if (action.onClick) {
      action.onClick();
    }
    setIsOpen(false);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        disabled={selectedCount === 0}
      >
        <Download className="h-4 w-4" />
        <span>Bulk Actions</span>
        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-blue-500 rounded-full">
          {selectedCount}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown menu */}
          <div className="absolute right-0 z-20 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="py-1">
              {mergedActions.map((action, index) => {
                const isDanger = action.variant === "danger";

                return (
                  <React.Fragment key={action.key}>
                    {index > 0 &&
                      action.key === "delete" &&
                      mergedActions[index - 1].key !== "delete" && (
                        <div className="my-1 border-t border-gray-200" />
                      )}
                    <button
                      onClick={() => handleActionClick(action)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        isDanger ? "text-red-700 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BulkActionsDropdown;
