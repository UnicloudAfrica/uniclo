import React from "react";
import { CheckCircle } from "lucide-react";
import { ModernButton } from "../ui";

interface ConfigurationSummary {
  id: string;
  name: string;
  region: string;
  count: number | string;
  months: number | string;
  canFastTrack?: boolean;
}

interface PricingSummary {
  currency: string;
  grandTotal: number;
}

interface OrderSuccessStepProps {
  orderId?: string;
  isFastTrack?: boolean;
  configurationSummaries: ConfigurationSummary[];
  pricingSummary: PricingSummary;
  instancesPageUrl: string;
  onCreateAnother: () => void;
}

/**
 * Shared order confirmation/success step for provisioning wizards.
 * Displays order ID, configuration summaries, and navigation actions.
 */
const OrderSuccessStep: React.FC<OrderSuccessStepProps> = ({
  orderId,
  isFastTrack = false,
  configurationSummaries,
  pricingSummary,
  instancesPageUrl,
  onCreateAnother,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isFastTrack ? "Instances Provisioning!" : "Order Confirmed!"}
            </h2>
            <p className="text-gray-500">
              {isFastTrack
                ? "Your instances are being deployed immediately"
                : "Your instances are being provisioned"}
            </p>
          </div>
        </div>

        {/* Order ID Banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-800">
            <strong>Order ID:</strong> {orderId || "—"}
          </p>
          <p className="text-sm text-green-700 mt-1">
            You will receive an email confirmation shortly.
          </p>
        </div>

        {/* Order Summary */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-semibold text-gray-800 mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            {configurationSummaries.map((cfg) => (
              <div key={cfg.id} className="flex justify-between items-center">
                <span className="text-gray-600">
                  {cfg.name} × {cfg.count} ({cfg.months} months)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 font-medium">{cfg.region}</span>
                  {cfg.canFastTrack && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      Fast-track
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-green-600">
                {isFastTrack
                  ? "Free (Fast-track)"
                  : `${pricingSummary.currency} ${pricingSummary.grandTotal.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <ModernButton
            onClick={() => (window.location.href = instancesPageUrl)}
            className="flex-1"
          >
            View My Instances
          </ModernButton>
          <ModernButton variant="outline" onClick={onCreateAnother}>
            Create Another
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessStep;
