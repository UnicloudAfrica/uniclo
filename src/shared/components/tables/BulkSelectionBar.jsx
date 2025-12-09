import React from "react";
import { Check, X, Trash2, Download, Archive, Copy } from "lucide-react";
import { ModernButton } from "../ui";

/**
 * BulkSelectionBar - Floating action bar for bulk operations
 *
 * Displays selected count and provides bulk action buttons.
 * Appears at bottom of screen when items are selected.
 * Mobile responsive with stacked layout.
 *
 * @param {Object} props
 * @param {number} props.selectedCount - Number of selected items
 * @param {Function} [props.onDelete] - Handler for bulk delete
 * @param {Function} [props.onExport] - Handler for bulk export
 * @param {Function} [props.onArchive] - Handler for bulk archive
 * @param {Function} [props.onDuplicate] - Handler for bulk duplicate
 * @param {Function} props.onClear - Handler to clear selection
 * @param {boolean} [props.showDelete=true] - Show delete button
 * @param {boolean} [props.showExport=true] - Show export button
 * @param {boolean} [props.showArchive=false] - Show archive button
 * @param {boolean} [props.showDuplicate=false] - Show duplicate button
 * @param {string} [props.itemType='item'] - Type of items (for labels)
 *
 * @example
 * <BulkSelectionBar
 *   selectedCount={5}
 *   onDelete={handleBulkDelete}
 *   onExport={handleBulkExport}
 *   onClear={() => setSelected([])}
 *   itemType="user"
 * />
 */
const BulkSelectionBar = ({
  selectedCount,
  onDelete,
  onExport,
  onArchive,
  onDuplicate,
  onClear,
  showDelete = true,
  showExport = true,
  showArchive = false,
  showDuplicate = false,
  itemType = "item",
}) => {
  if (selectedCount === 0) return null;

  const itemLabel = selectedCount === 1 ? itemType : `${itemType}s`;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 rounded-2xl border border-slate-200 bg-white px-4 sm:px-6 py-3 sm:py-4 shadow-2xl">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-900">
            {selectedCount} {itemLabel} selected
          </span>
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-200" />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {showExport && onExport && (
            <ModernButton variant="outline" size="sm" onClick={onExport} className="gap-2 text-xs">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </ModernButton>
          )}

          {showDuplicate && onDuplicate && (
            <ModernButton
              variant="secondary"
              size="sm"
              onClick={onDuplicate}
              className="gap-2 text-xs"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Duplicate</span>
            </ModernButton>
          )}

          {showArchive && onArchive && (
            <ModernButton variant="ghost" size="sm" onClick={onArchive} className="gap-2 text-xs">
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Archive</span>
            </ModernButton>
          )}

          {showDelete && onDelete && (
            <ModernButton variant="danger" size="sm" onClick={onDelete} className="gap-2 text-xs">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </ModernButton>
          )}

          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          <ModernButton variant="ghost" size="sm" onClick={onClear} className="gap-2 text-xs">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default BulkSelectionBar;
