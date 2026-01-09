// @ts-nocheck
import React, { useState } from "react";
import {
  Wallet,
  CreditCard,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings,
  DollarSign,
  Key,
  Loader2,
} from "lucide-react";
import {
  useAdminTenantBillingConfig,
  useAdminTenantBillingSummary,
  useUpdateTenantBillingConfig,
  useAddTenantCredit,
} from "../../../hooks/useAdminTenantBilling";

const BILLING_MODELS = [
  { value: "direct", label: "Direct Payment", icon: CreditCard },
  { value: "prepaid_credit", label: "Prepaid Credit", icon: Wallet },
  { value: "credit_limit", label: "Credit Limit", icon: Shield },
  { value: "paystack_split", label: "Paystack Split", icon: CreditCard },
  { value: "trust_invoice", label: "Trust + Invoice", icon: Clock },
];

interface Props {
  tenantId: string;
}

export default function TenantBillingTab({ tenantId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDescription, setCreditDescription] = useState("");

  const [formData, setFormData] = useState({
    billing_model: "direct",
    allowed_billing_models: ["direct", "prepaid_credit"],
    credit_limit_cents: 0,
    margin_percent: 0,
    payment_terms_days: 30,
    auto_suspend_on_overdue: true,
    allow_client_gateway: false,
  });

  const { data: config, isLoading: isLoadingConfig } = useAdminTenantBillingConfig(tenantId);
  const { data: summary, isLoading: isLoadingSummary } = useAdminTenantBillingSummary(tenantId);
  const updateConfigMutation = useUpdateTenantBillingConfig();
  const addCreditMutation = useAddTenantCredit();

  // Initialize form when config loads
  React.useEffect(() => {
    if (config) {
      setFormData({
        billing_model: config.billing_model || "direct",
        allowed_billing_models: config.allowed_billing_models || ["direct", "prepaid_credit"],
        credit_limit_cents: config.credit_limit_cents || 0,
        margin_percent: config.margin_percent || 0,
        payment_terms_days: config.payment_terms_days || 30,
        auto_suspend_on_overdue: config.auto_suspend_on_overdue ?? true,
        allow_client_gateway: config.allow_client_gateway ?? false,
      });
    }
  }, [config]);

  const handleSave = async () => {
    await updateConfigMutation.mutateAsync({
      tenantId,
      data: formData,
    });
    setIsEditing(false);
  };

  const handleAddCredit = async () => {
    if (!creditAmount || isNaN(parseFloat(creditAmount))) return;

    await addCreditMutation.mutateAsync({
      tenantId,
      amount_cents: Math.round(parseFloat(creditAmount) * 100),
      description: creditDescription || undefined,
    });

    setShowAddCredit(false);
    setCreditAmount("");
    setCreditDescription("");
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(cents / 100);
  };

  const toggleAllowedModel = (model: string) => {
    const current = formData.allowed_billing_models || [];
    if (current.includes(model)) {
      setFormData({
        ...formData,
        allowed_billing_models: current.filter((m) => m !== model),
      });
    } else {
      setFormData({
        ...formData,
        allowed_billing_models: [...current, model],
      });
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading billing configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Wallet Balance</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(summary?.wallet_balance_cents || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Credit Limit</p>
              <p className="text-lg font-semibold text-purple-600">
                {formatCurrency(summary?.credit_limit_cents || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                summary?.is_overdue ? "bg-red-100" : "bg-yellow-100"
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 ${summary?.is_overdue ? "text-red-600" : "text-yellow-600"}`}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500">Outstanding</p>
              <p
                className={`text-lg font-semibold ${
                  summary?.is_overdue ? "text-red-600" : "text-yellow-600"
                }`}
              >
                {formatCurrency(summary?.total_outstanding_cents || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Billing Model</p>
              <p className="text-lg font-semibold text-blue-600 capitalize">
                {(config?.billing_model || "direct").replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowAddCredit(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Credit
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <Settings className="w-4 h-4" />
          {isEditing ? "Cancel Editing" : "Edit Configuration"}
        </button>
      </div>

      {/* Add Credit Modal */}
      {showAddCredit && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h4 className="font-medium text-blue-900 mb-3">Add Prepaid Credit</h4>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">Amount (NGN)</label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="1000.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">Description (optional)</label>
              <input
                type="text"
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
                placeholder="Manual top-up"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleAddCredit}
              disabled={addCreditMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {addCreditMutation.isPending ? "Adding..." : "Add Credit"}
            </button>
            <button
              onClick={() => setShowAddCredit(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      {isEditing ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
          {/* Allowed Billing Models */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Allowed Billing Models
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {BILLING_MODELS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => toggleAllowedModel(value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    formData.allowed_billing_models?.includes(value)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium">{label}</span>
                  {formData.allowed_billing_models?.includes(value) && (
                    <CheckCircle className="w-4 h-4 text-blue-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Current Billing Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Billing Model
            </label>
            <select
              value={formData.billing_model}
              onChange={(e) => setFormData({ ...formData, billing_model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {BILLING_MODELS.filter((m) => formData.allowed_billing_models?.includes(m.value)).map(
                ({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Credit Limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Limit (NGN)
              </label>
              <input
                type="number"
                value={formData.credit_limit_cents / 100}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    credit_limit_cents: Math.round(parseFloat(e.target.value || "0") * 100),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margin Percent (%)
              </label>
              <input
                type="number"
                value={formData.margin_percent}
                onChange={(e) =>
                  setFormData({ ...formData, margin_percent: parseFloat(e.target.value || "0") })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Payment Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms (days)
              </label>
              <input
                type="number"
                value={formData.payment_terms_days}
                onChange={(e) =>
                  setFormData({ ...formData, payment_terms_days: parseInt(e.target.value || "30") })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.auto_suspend_on_overdue}
                onChange={(e) =>
                  setFormData({ ...formData, auto_suspend_on_overdue: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto-suspend services when overdue</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allow_client_gateway}
                onChange={(e) =>
                  setFormData({ ...formData, allow_client_gateway: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Allow tenant to configure their own payment gateway
              </span>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateConfigMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      ) : (
        /* Read-only Config Display */
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Current Configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Billing Model</p>
              <p className="font-medium capitalize">
                {(config?.billing_model || "direct").replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Credit Limit</p>
              <p className="font-medium">{formatCurrency(config?.credit_limit_cents || 0)}</p>
            </div>
            <div>
              <p className="text-gray-500">Margin</p>
              <p className="font-medium">{config?.margin_percent || 0}%</p>
            </div>
            <div>
              <p className="text-gray-500">Payment Terms</p>
              <p className="font-medium">{config?.payment_terms_days || 30} days</p>
            </div>
            <div>
              <p className="text-gray-500">Auto-Suspend</p>
              <p className="font-medium">{config?.auto_suspend_on_overdue ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-gray-500">Client Gateway</p>
              <p className="font-medium">
                {config?.allow_client_gateway ? "Allowed" : "Not Allowed"}
              </p>
            </div>
          </div>

          {config?.allowed_billing_models?.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-gray-500 text-sm mb-2">Allowed Models</p>
              <div className="flex flex-wrap gap-2">
                {config.allowed_billing_models.map((model) => (
                  <span
                    key={model}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize"
                  >
                    {model.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {config?.payment_gateways?.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-gray-500 text-sm mb-2">Configured Gateways</p>
              <div className="flex flex-wrap gap-2">
                {config.payment_gateways.map((gw) => (
                  <span
                    key={gw.id}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      gw.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Key className="w-3 h-3" />
                    {gw.provider}
                    {gw.is_test_mode && " (test)"}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
