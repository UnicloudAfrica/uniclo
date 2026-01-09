// Order Review Step - Final confirmation before payment
import React from "react";
import { useTemplateCart } from "../../../../stores/templateCartStore";
import { Check } from "lucide-react";

interface OrderReviewStepProps {
  project: any;
  keypairName: string;
  onBack: () => void;
  onProceedToPayment: () => void;
}

const OrderReviewStep: React.FC<OrderReviewStepProps> = ({
  project,
  keypairName,
  onBack,
  onProceedToPayment,
}) => {
  const { items, getCartTotal } = useTemplateCart();
  const { monthly, yearly } = getCartTotal();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Step 3: Review Your Order</h2>
        <p className="text-slate-600 mb-6">
          Please review your order details before proceeding to payment
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Infrastructure Summary */}
            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Infrastructure Setup</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Project:</span>
                  <span className="font-medium text-slate-900">{project.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Region:</span>
                  <span className="font-medium text-slate-900">{project.region}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">SSH Key Pair:</span>
                  <span className="font-medium text-slate-900">{keypairName}</span>
                </div>
              </div>
            </div>

            {/* Instance Templates */}
            <div className="border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Instances ({items.reduce((sum, item) => sum + item.quantity, 0)} total)
              </h3>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.templateId}
                    className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 mb-1">{item.template.name}</div>
                      <div className="text-sm text-slate-600 mb-2">Quantity: {item.quantity}</div>

                      {/* Specs */}
                      {item.template.configuration?.compute && (
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs">
                            {item.template.configuration.compute.vcpu} vCPU
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs">
                            {Math.round(item.template.configuration.compute.ram_mb / 1024)}GB RAM
                          </span>
                          {item.template.configuration.volumes?.[0] && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs">
                              {item.template.configuration.volumes[0].size_gb}GB Storage
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">
                        $
                        {(
                          (item.template.pricing_cache?.monthly_total_usd || 0) * item.quantity
                        ).toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-600">/month</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Pricing Summary */}
          <div className="lg:col-span-1">
            <div className="border border-slate-200 rounded-lg p-6 sticky top-6">
              <h3 className="font-semibold text-slate-900 mb-4">Pricing Summary</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-slate-600">
                  <span>Monthly:</span>
                  <span className="font-semibold">${monthly.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Yearly:</span>
                  <span className="font-semibold">${yearly.toFixed(2)}</span>
                </div>
                {yearly < monthly * 12 && (
                  <div className="flex justify-between text-green-600 text-sm">
                    <span>Savings:</span>
                    <span className="font-semibold">${(monthly * 12 - yearly).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4 mb-6">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-slate-900 font-semibold">Total:</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">${monthly.toFixed(2)}</div>
                    <div className="text-sm text-slate-600">/month</div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    Your instances will be automatically provisioned after payment
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            ← Back
          </button>

          <button
            onClick={onProceedToPayment}
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Proceed to Payment →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderReviewStep;
