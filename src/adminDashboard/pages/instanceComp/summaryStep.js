import React from "react";

const SummaryStep = ({ formData }) => {
  return (
    <div className="space-y-4 w-full text-gray-700">
      <h3 className="text-lg font-semibold text-[#121212] mb-4">
        Summary of Your Instance Request
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Configuration Details */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-[#288DD1] mb-2">
            Configuration Details
          </h4>
          <p>
            <strong>Name:</strong> {formData.name || "N/A"}
          </p>
          <p>
            <strong>Description:</strong>{" "}
            {formData.description || "No description provided"}
          </p>
          <p>
            <strong>Project:</strong> {formData.selectedProject?.name || "N/A"}
          </p>
          <p>
            <strong>Tags:</strong>{" "}
            {formData.tags.length > 0 ? formData.tags.join(", ") : "None"}
          </p>
        </div>

        {/* Resource Allocation Details */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-[#288DD1] mb-2">
            Resource Allocation
          </h4>
          <p>
            <strong>Storage Size:</strong>{" "}
            {formData.storage_size_gb
              ? `${formData.storage_size_gb} GiB`
              : "N/A"}
          </p>
          <p>
            <strong>Compute Instance:</strong>{" "}
            {formData.selectedComputeInstance?.name || "N/A"}
          </p>
          <p>
            <strong>EBS Volume:</strong>{" "}
            {formData.selectedEbsVolume?.name || "N/A"}
          </p>
          <p>
            <strong>OS Image:</strong> {formData.selectedOsImage?.name || "N/A"}
          </p>
          <p>
            <strong>Bandwidth:</strong>{" "}
            {formData.bandwidth_id
              ? formData.bandwidths?.find((b) => b.id === formData.bandwidth_id)
                  ?.name || "N/A"
              : "N/A"}
          </p>
          <p>
            <strong>Term:</strong>{" "}
            {formData.months ? `${formData.months} Months` : "N/A"}
          </p>
        </div>
      </div>

      {/* You can add more details or a total cost calculation here if available in formData */}
      {/* Example:
      <div className="mt-6 p-4 bg-[#E0F2F7] rounded-lg text-center text-lg font-semibold text-[#288DD1]">
        Estimated Total Cost: $X.XX (per month)
      </div>
      */}
    </div>
  );
};

export default SummaryStep;
