import React from "react";

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-sm font-medium text-gray-600">{label}:</span>
    <span className="text-sm text-gray-900 text-right">{value || "N/A"}</span>
  </div>
);

export const SummaryStep = ({ formData, pricingRequests }) => (
  <div className="space-y-6 w-full">
    <div className="text-center mb-6">
      <h3 className="text-xl font-semibold text-gray-800">Request Summary</h3>
      <p className="text-sm text-gray-500 mt-1">
        Please review the details of your instance request below before
        submitting.
      </p>
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Request Details
      </h3>
      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        {/* Project is now per-configuration */}
        <DetailRow label="Request Name" value={formData.name} />
        <DetailRow label="Tags" value={formData.tags.join(", ")} />
        <DetailRow
          label="Fast Track"
          value={formData.fast_track ? "Yes" : "No"}
        />
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Instance Configurations ({pricingRequests.length})
      </h3>
      <div className="space-y-4">
        {pricingRequests.length > 0 ? (
          pricingRequests.map((req, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-semibold text-gray-700">
                Configuration #{index + 1}
              </h4>
              <DetailRow label="Project" value={req._display.project} />
              <DetailRow
                label="Compute"
                value={`${req.number_of_instances}x ${req._display.compute}`}
              />
              <DetailRow label="Storage" value={req._display.storage} />
              <DetailRow label="OS Image" value={req._display.os} />
              <DetailRow label="Key Pair" value={req.keypair_name} />
              <DetailRow label="Subnet ID" value={req.subnet_id} />
              <DetailRow
                label="Security Groups"
                value={req.security_group_ids.join(", ")}
              />
              <DetailRow label="Term" value={`${req.months} months`} />
              {req.bandwidth_id && (
                <DetailRow
                  label="Bandwidth"
                  value={`${req.bandwidth_count} units`}
                />
              )}
              {/* Add other optional fields here in a similar way */}
              {/* e.g., Floating IP, Cross Connect */}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">
            No configurations to summarize.
          </p>
        )}
      </div>
    </div>
  </div>
);

export default SummaryStep;
