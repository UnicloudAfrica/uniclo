import React from "react";
import { X, Package } from "lucide-react";
import { formatRegionName } from "../../../../utils/regionUtils";
import { PricingRequest, ObjectStorageRequest } from "../types";

const getDisplayName = (display: unknown): string | null => {
  if (!display || typeof display !== "object") return null;
  if (!("name" in display)) return null;
  const record = display as { name?: unknown };
  return typeof record.name === "string" ? record.name : null;
};

interface InvoiceItemQueueProps {
  items: (PricingRequest | ObjectStorageRequest)[];
  onRemove: (index: number) => void;
  onEdit?: (index: number) => void;
  readOnly?: boolean;
  type?: "compute" | "storage";
}

const InvoiceItemQueue: React.FC<InvoiceItemQueueProps> = ({
  items = [],
  onRemove,
  _onEdit,
  readOnly = false,
  type = "compute",
}) => {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <Package className="mx-auto h-12 w-12 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-600">No items added yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Configure and add items using the builder above
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">
          {type === "compute" ? "Compute Configurations" : "Storage Items"} ({items.length})
        </h4>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                    {formatRegionName(item.region)}
                  </span>
                  {"_display" in item && item._display && "compute" in item._display && (
                    <span className="text-sm font-semibold text-slate-900">
                      {item._display.compute}
                    </span>
                  )}
                  {"_display" in item && item._display && "name" in item._display && (
                    <span className="text-sm font-semibold text-slate-900">
                      {getDisplayName(item._display)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                  {"_display" in item && item._display && "os" in item._display && (
                    <span>OS: {item._display.os}</span>
                  )}
                  {"number_of_instances" in item && item.number_of_instances && (
                    <span>
                      {item.number_of_instances} instance{item.number_of_instances > 1 ? "s" : ""}
                    </span>
                  )}
                  {item.months && (
                    <span>
                      {item.months} month{(item as any).months > 1 ? "s" : ""}
                    </span>
                  )}
                  {"_display" in item && item._display && "storage" in item._display && (
                    <span>Storage: {item._display.storage}</span>
                  )}
                  {"_display" in item && item._display && "quantity" in item._display && (
                    <span>{item._display.quantity}</span>
                  )}
                </div>
              </div>
              {!readOnly && (
                <button
                  onClick={() => onRemove(index)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove item"
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

export default InvoiceItemQueue;
