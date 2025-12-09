// @ts-nocheck
import React from "react";
import { X, Check, X as Cross, Activity } from "lucide-react";

const ViewRegionModal = ({ isOpen, onClose, region }: any) => {
  if (!isOpen || !region) return null;

  const formatScalar = (value: any) => {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }
    if (typeof value === "boolean") {
      return value ? "Enabled" : "Disabled";
    }
    if (typeof value === "number") {
      return Number.isFinite(value) ? value.toLocaleString() : String(value);
    }
    if (Array.isArray(value)) {
      if (!value.length) return "N/A";
      return value
        .map((item: any) =>
          typeof item === "object" && item !== null ? JSON.stringify(item) : String(item)
        )
        .join(", ");
    }

    return String(value);
  };

  const renderNestedObject = (obj: any) => {
    if (!obj || typeof obj !== "object") {
      return null;
    }

    return (
      <div className="mt-1 space-y-1 text-xs text-gray-500 text-right">
        {Object.entries(obj).map(([nestedKey, nestedValue]) => (
          <div key={nestedKey} className="flex items-start justify-between gap-3">
            <span className="capitalize text-gray-500">{nestedKey.replace(/_/g, " ")}:</span>
            <span className="font-medium text-gray-700">
              {typeof nestedValue === "object" && nestedValue !== null
                ? JSON.stringify(nestedValue)
                : formatScalar(nestedValue)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Parse features if it's a JSON string, otherwise use as object
  const parsedFeatures =
    typeof region.features === "string" ? JSON.parse(region.features) : region.features;

  const features =
    Array.isArray(parsedFeatures) && parsedFeatures.length > 0
      ? parsedFeatures.reduce((acc, feature) => {
          acc[feature] = true;
          return acc;
        }, {})
      : parsedFeatures;

  const metrics = region.metrics && typeof region.metrics === "object" ? region.metrics : null;
  const metaRaw = region.meta?.raw && typeof region.meta.raw === "object" ? region.meta.raw : null;

  const status = region.status || "unknown";
  const statusStyles =
    status === "healthy"
      ? {
          background: "rgba(34,197,94,0.12)",
          color: "#15803d",
        }
      : {
          background: "rgba(249,115,22,0.12)",
          color: "#c2410c",
        };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">View Region Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-4 w-full text-sm text-gray-600">
            <div className="flex justify-between">
              <span className="font-medium">Provider:</span>
              <span>{region.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Code:</span>
              <span>{region.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>
              <span>{region.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Country Code:</span>
              <span>{region.country_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">City:</span>
              <span>{region.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Base URL:</span>
              <span>{region.base_url || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                style={statusStyles}
              >
                <Activity size={14} />
                {status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Active:</span>
              <span>{region.is_active ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Priority:</span>
              <span>{region.priority ?? "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Price Multiplier:</span>
              <span>{region.price_multiplier ?? "1.0"}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium mb-2">Features:</span>
              <div className="space-y-2">
                {features ? (
                  Object.entries(features).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <span className="capitalize">{key.replace(/_/g, " ")}:</span>
                      {value ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Cross className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  ))
                ) : (
                  <span>N/A</span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Provider Label:</span>
              <span>{region.meta?.provider_label || "N/A"}</span>
            </div>
            {metaRaw && (
              <div className="flex flex-col">
                <span className="font-medium mb-2">Metadata:</span>
                <div className="space-y-1">
                  {Object.entries(metaRaw).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>
                      {value && typeof value === "object" && !Array.isArray(value) ? (
                        <div className="flex-1">{renderNestedObject(value)}</div>
                      ) : (
                        <span className="text-gray-500 text-right">{formatScalar(value)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {metrics && Object.keys(metrics).length > 0 && (
              <div className="flex flex-col">
                <span className="font-medium mb-2">Metrics:</span>
                <div className="space-y-1">
                  {Object.entries(metrics).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>
                      {value && typeof value === "object" && !Array.isArray(value) ? (
                        <div className="flex-1">{renderNestedObject(value)}</div>
                      ) : (
                        <span className="text-gray-500 text-right">{formatScalar(value)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-medium">Created At:</span>
              <span>{new Date(region.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Updated At:</span>
              <span>{new Date(region.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewRegionModal;
