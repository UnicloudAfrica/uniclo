// Template Pricing Display Component
import React from "react";

interface PricingBreakdownProps {
  pricingData: {
    breakdown: any;
    monthly_total_usd: number;
    yearly_total_usd: number;
    currency: string;
  };
  showYearly?: boolean;
}

const PricingBreakdown: React.FC<PricingBreakdownProps> = ({ pricingData, showYearly = false }) => {
  if (!pricingData) {
    return null;
  }

  const { breakdown, monthly_total_usd, yearly_total_usd, currency } = pricingData;
  const currencySymbol = currency === "USD" ? "$" : currency === "NGN" ? "₦" : currency;
  const total = showYearly ? yearly_total_usd : monthly_total_usd;
  const period = showYearly ? "year" : "month";

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Pricing Breakdown</h3>

      <div className="space-y-3">
        {breakdown.compute && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">{breakdown.compute.name}</span>
            <span className="text-sm font-medium">
              {currencySymbol}
              {formatPrice(breakdown.compute.subtotal_usd)}
            </span>
          </div>
        )}

        {breakdown.os_image && breakdown.os_image.subtotal_usd > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">{breakdown.os_image.name}</span>
            <span className="text-sm font-medium">
              {currencySymbol}
              {formatPrice(breakdown.os_image.subtotal_usd)}
            </span>
          </div>
        )}

        {breakdown.volumes &&
          breakdown.volumes.length > 0 &&
          breakdown.volumes.map((vol: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-sm text-slate-600">{vol.name}</span>
              <span className="text-sm font-medium">
                {currencySymbol}
                {formatPrice(vol.subtotal_usd)}
              </span>
            </div>
          ))}

        {breakdown.bandwidth && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">{breakdown.bandwidth.name}</span>
            <span className="text-sm font-medium">
              {currencySymbol}
              {formatPrice(breakdown.bandwidth.subtotal_usd)}
            </span>
          </div>
        )}

        <div className="border-t border-slate-200 my-4"></div>

        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-slate-900">Total</span>
          <span className="text-xl font-bold text-primary-600">
            {currencySymbol}
            {formatPrice(total)}/{period}
          </span>
        </div>

        {showYearly && yearly_total_usd < monthly_total_usd * 12 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-4">
            <p className="text-sm text-green-800">
              💰 Save {currencySymbol}
              {formatPrice(monthly_total_usd * 12 - yearly_total_usd)} with yearly billing!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingBreakdown;
