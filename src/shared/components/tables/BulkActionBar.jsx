import React from "react";
import { Check } from "lucide-react";

/**
 * BulkActionBar - Action bar for bulk operations on selected leads
 */
const BulkActionBar = ({ selectedCount, onAssign, onDelete, onExport, onClearSelection }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-900">
            {selectedCount} {selectedCount === 1 ? "lead" : "leads"} selected
          </span>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAssign}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
          >
            Assign
          </button>

          <button
            type="button"
            onClick={onExport}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
          >
            Export
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            Delete
          </button>

          <div className="h-6 w-px bg-slate-200" />

          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionBar;
