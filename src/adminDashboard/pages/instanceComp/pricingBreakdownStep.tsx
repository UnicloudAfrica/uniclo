// @ts-nocheck
import React from "react";

const DetailRow = ({ label, value, isTotal = false }: any) => (
  <div
    className={`flex justify-between items-center py-2 ${
      !isTotal ? "border-b border-gray-100" : ""
    } ${isTotal ? "font-semibold" : ""}`}
  >
    <span className="text-sm text-gray-600">{label}:</span>
    <span className="text-sm text-gray-900">{value}</span>
  </div>
);

const PricingBreakdownStep = ({ apiResponse }: any) => {
  if (!apiResponse?.metadata?.pricing_breakdown) {
    return <div className="text-center text-gray-500">No pricing information available.</div>;
  }

  const formatCurrency = (amount: any, currency: any) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "NGN",
    }).format(amount);
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Request Confirmation</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your instance request has been successfully created with transaction reference{" "}
          <strong className="text-gray-900">{apiResponse.identifier}</strong>.
        </p>
      </div>
      {apiResponse.metadata.pricing_breakdown.map((breakdown, index) => (
        <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-2">
          <h4 className="font-semibold text-gray-700">Pricing for Configuration #{index + 1}</h4>
          {breakdown.lines.map((line, lineIndex) => (
            <DetailRow
              key={lineIndex}
              label={line.name}
              value={formatCurrency(line.total, breakdown.currency)}
            />
          ))}
          <hr className="my-2" />
          <DetailRow
            label="Total"
            value={formatCurrency(breakdown.total, breakdown.currency)}
            isTotal={true}
          />
        </div>
      ))}
    </div>
  );
};

export default PricingBreakdownStep;
