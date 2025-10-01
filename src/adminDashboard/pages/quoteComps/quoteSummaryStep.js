import React from "react";

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
    <span className="text-sm font-medium text-gray-600">{label}:</span>
    <span className="text-sm text-gray-900 text-right">{value || "N/A"}</span>
  </div>
);

export const QuoteSummaryStep = ({ formData, pricingRequests, tenants }) => {
  const selectedTenant = tenants?.find(
    (t) => tenants && String(t.id) === String(formData.tenant_id)
  );

  return (
    <div className="space-y-6 w-full max-w-3xl">
      <div className="text- mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Quote Summary</h3>
        <p className="text-sm text-gray-500 mt-1">
          Please review all details before submitting the quote.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Quote Details
        </h3>
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <DetailRow label="Subject" value={formData.subject} />
          {selectedTenant && (
            <DetailRow label="Tenant" value={selectedTenant.name} />
          )}
          <DetailRow label="Primary Email" value={formData.email} />
          <DetailRow label="Bill To Name" value={formData.bill_to_name} />
          <DetailRow label="CC Emails" value={formData.emails} />
          <DetailRow label="Notes" value={formData.notes} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Quoted Items ({pricingRequests.length})
        </h3>
        <div className="space-y-4">
          {pricingRequests.length > 0 ? (
            pricingRequests.map((req, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-2">
                <h4 className="font-semibold text-gray-700">
                  Item #{index + 1}
                </h4>
                <DetailRow
                  label="Configuration"
                  value={`${req.number_of_instances}x ${req._display.compute}`}
                />
                <DetailRow label="Region" value={req.region} />
                <DetailRow label="OS Image" value={req._display.os} />
                <DetailRow label="Storage" value={req._display.storage} />
                <DetailRow label="Term" value={`${req.months} months`} />
                {req.bandwidth_id && (
                  <DetailRow
                    label="Bandwidth"
                    value={`${req.bandwidth_count} units`}
                  />
                )}
                {req.floating_ip_id && (
                  <DetailRow
                    label="Floating IPs"
                    value={`${req.floating_ip_count} units`}
                  />
                )}
                {req.cross_connect_id && (
                  <DetailRow
                    label="Cross Connects"
                    value={`${req.cross_connect_count} units`}
                  />
                )}
                {req.floating_ip_id && (
                  <DetailRow
                    label="Floating IPs"
                    value={`${req.floating_ip_count} units`}
                  />
                )}
                {req.cross_connect_id && (
                  <DetailRow
                    label="Cross Connects"
                    value={`${req.cross_connect_count} units`}
                  />
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No items have been added to this quote.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteSummaryStep;
