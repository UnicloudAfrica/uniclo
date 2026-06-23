import React from "react";
import { X, Puzzle } from "lucide-react";
import type { IntegrationLineRequest } from "../types";

interface IntegrationItemQueueProps {
  items: IntegrationLineRequest[];
  onRemove?: (index: number) => void;
  readOnly?: boolean;
}

/** Read-only list of staged integration line items (cart + review). */
const IntegrationItemQueue: React.FC<IntegrationItemQueueProps> = ({
  items = [],
  onRemove,
  readOnly = false,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">Integration Services ({items.length})</h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-primary-50 p-1 text-primary-600">
                    <Puzzle className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{item._display?.name}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span>Qty: {item.quantity}</span>
                  {item.months > 1 && <span>{item.months} months</span>}
                  {item._display?.unit_summary && <span>{item._display.unit_summary}</span>}
                  {item.bucket_size_gb != null && <span>{item.bucket_size_gb} GB bucket</span>}
                </div>
              </div>
              {!readOnly && onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove integration item"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationItemQueue;
