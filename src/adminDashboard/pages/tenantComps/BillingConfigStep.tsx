// @ts-nocheck
import React from "react";
import { CreditCard, Wallet, Shield, Clock, CheckCircle } from "lucide-react";

const BILLING_MODELS = [
  {
    value: "direct",
    label: "Direct Payment",
    description: "Pay UniCloud directly for each order",
    icon: CreditCard,
  },
  {
    value: "prepaid_credit",
    label: "Prepaid Credit",
    description: "Top up wallet, deduct on provisioning",
    icon: Wallet,
  },
  {
    value: "credit_limit",
    label: "Credit Limit",
    description: "Order now, pay later (up to limit)",
    icon: Shield,
  },
  {
    value: "paystack_split",
    label: "Paystack Split",
    description: "Payments split between partner and UniCloud",
    icon: CreditCard,
  },
  {
    value: "trust_invoice",
    label: "Monthly Invoice",
    description: "Services first, invoiced monthly",
    icon: Clock,
  },
];

interface BillingConfigStepProps {
  formData: any;
  setFormData: (data: any) => void;
  errors: any;
}

const BillingConfigStep: React.FC<BillingConfigStepProps> & {
  validate: (data: any) => any;
} = ({ formData, setFormData, errors }) => {
  const billingConfig = formData.billing || {
    billing_model: "direct",
    allowed_billing_models: ["direct", "prepaid_credit"],
    credit_limit_cents: 0,
    margin_percent: 0,
    payment_terms_days: 30,
    auto_suspend_on_overdue: true,
    allow_client_gateway: false,
  };

  const updateBilling = (updates: any) => {
    setFormData({
      ...formData,
      billing: { ...billingConfig, ...updates },
    });
  };

  const toggleAllowedModel = (model: string) => {
    const current = billingConfig.allowed_billing_models || [];
    if (current.includes(model)) {
      updateBilling({ allowed_billing_models: current.filter((m: string) => m !== model) });
    } else {
      updateBilling({ allowed_billing_models: [...current, model] });
    }
  };

  return (
    <div className="space-y-6 font-Outfit">
      {/* Allowed Billing Models */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Allowed Billing Models
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Select which billing models this partner can use. They can choose from these options.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BILLING_MODELS.map(({ value, label, description, icon: Icon }) => {
            const isSelected = billingConfig.allowed_billing_models?.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleAllowedModel(value)}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{label}</span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-blue-500" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{description}</p>
                </div>
              </button>
            );
          })}
        </div>
        {errors.allowed_billing_models && (
          <p className="text-red-500 text-xs mt-2">{errors.allowed_billing_models}</p>
        )}
      </div>

      {/* Default Billing Model */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Billing Model
        </label>
        <select
          value={billingConfig.billing_model}
          onChange={(e) => updateBilling({ billing_model: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {BILLING_MODELS.filter((m) =>
            billingConfig.allowed_billing_models?.includes(m.value)
          ).map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Credit Limit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Credit Limit (NGN)</label>
          <input
            type="number"
            value={(billingConfig.credit_limit_cents || 0) / 100}
            onChange={(e) =>
              updateBilling({
                credit_limit_cents: Math.round(parseFloat(e.target.value || "0") * 100),
              })
            }
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum credit this partner can use</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Margin Percent (%)</label>
          <input
            type="number"
            value={billingConfig.margin_percent || 0}
            onChange={(e) => updateBilling({ margin_percent: parseFloat(e.target.value || "0") })}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Partner's markup percentage</p>
        </div>
      </div>

      {/* Payment Terms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms (days)</label>
        <input
          type="number"
          value={billingConfig.payment_terms_days || 30}
          onChange={(e) => updateBilling({ payment_terms_days: parseInt(e.target.value || "30") })}
          placeholder="30"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Days allowed for payment after invoice</p>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-4 border-t">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={billingConfig.auto_suspend_on_overdue}
            onChange={(e) => updateBilling({ auto_suspend_on_overdue: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-sm text-gray-700 font-medium">Auto-suspend on overdue</span>
            <p className="text-xs text-gray-500">
              Automatically suspend services when payment is overdue
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={billingConfig.allow_client_gateway}
            onChange={(e) => updateBilling({ allow_client_gateway: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-sm text-gray-700 font-medium">Allow own payment gateway</span>
            <p className="text-xs text-gray-500">
              Partner can configure their own Paystack/Stripe keys
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

BillingConfigStep.validate = (formData: any) => {
  const errors: any = {};
  const billing = formData.billing || {};

  if (!billing.allowed_billing_models || billing.allowed_billing_models.length === 0) {
    errors.allowed_billing_models = "At least one billing model must be allowed";
  }

  return errors;
};

export default BillingConfigStep;
