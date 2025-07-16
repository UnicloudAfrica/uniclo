import React from "react";

const SummaryStep = ({ formData }) => (
  <div className="space-y-3 w-full">
    <h3 className="text-lg font-semibold text-gray-800">
      Summary of Your Order
    </h3>
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600">Name:</span>
      <span className="text-sm text-gray-900">{formData.name || "N/A"}</span>
    </div>
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600">Description:</span>
      <span className="text-sm text-gray-900">
        {formData.description || "N/A"}
      </span>
    </div>
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600">Project:</span>
      <span className="text-sm text-gray-900">
        {formData.selectedProject?.name || "N/A"}
      </span>
    </div>
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600">
        Storage Size (GiB):
      </span>
      <span className="text-sm text-gray-900">
        {formData.storage_size_gb || "N/A"}
      </span>
    </div>
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600">
        Compute Instance:
      </span>
      <span className="text-sm text-gray-900">
        {formData.selectedComputeInstance?.name || "N/A"} (CPU:{" "}
        {formData.selectedComputeInstance?.vcpus}, RAM:{" "}
        {formData.selectedComputeInstance?.memory_gib}GB)
      </span>
    </div>
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600">EBS Volume:</span>
      <span className="text-sm text-gray-900">
        {formData.selectedEbsVolume?.name || "N/A"}
      </span>
    </div>
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600">OS Image:</span>
      <span className="text-sm text-gray-900">
        {formData.selectedOsImage?.name || "N/A"}
      </span>
    </div>
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600">Term (Months):</span>
      <span className="text-sm text-gray-900">{formData.months || "N/A"}</span>
    </div>
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-sm font-medium text-gray-600">Tags:</span>
      <span className="text-sm text-gray-900">
        {formData.tags.length > 0 ? formData.tags.join(", ") : "N/A"}
      </span>
    </div>
    <p className="text-center text-gray-700 italic mt-4">
      Please review your selections before proceeding to payment.
    </p>
  </div>
);

export default SummaryStep;
