import React from "react";
import { X, Check, X as Cross } from "lucide-react";

const ViewRegionModal = ({ isOpen, onClose, region }) => {
  if (!isOpen || !region) return null;

  // Parse features if it's a JSON string, otherwise use as object
  const features =
    typeof region.features === "string"
      ? JSON.parse(region.features)
      : region.features;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            View Region Details
          </h2>
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
              <span className="font-medium">Active:</span>
              <span>{region.is_active ? "Yes" : "No"}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium mb-2">Features:</span>
              <div className="space-y-2">
                {features ? (
                  Array.isArray(features) ? (
                    features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center space-x-2"
                      >
                        <span className="capitalize">{feature}:</span>
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                    ))
                  ) : (
                    Object.entries(features).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <span className="capitalize">{key}:</span>
                        {value ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Cross className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    ))
                  )
                ) : (
                  <span>N/A</span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Provider Label:</span>
              <span>{region.meta?.provider_label || "N/A"}</span>
            </div>
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
