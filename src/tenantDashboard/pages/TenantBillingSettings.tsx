// @ts-nocheck
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Wallet,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  Key,
  Trash2,
  Plus,
  Shield,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import {
  useTenantBillingConfig,
  useTenantBillingBalance,
  useTenantPaymentGateways,
  useSelectBillingModel,
  useSavePaymentGateway,
  useDeletePaymentGateway,
} from "../../hooks/useTenantBilling";

const BILLING_MODEL_INFO = {
  direct: {
    label: "Direct Payment",
    description: "Pay UniCloud directly for each order",
    icon: CreditCard,
    color: "blue",
  },
  prepaid_credit: {
    label: "Prepaid Credit",
    description: "Top up your wallet, provisioning deducts from balance",
    icon: Wallet,
    color: "green",
  },
  credit_limit: {
    label: "Credit Limit",
    description: "Order now, pay later (up to your limit)",
    icon: Shield,
    color: "purple",
  },
  paystack_split: {
    label: "Paystack Split",
    description: "Payments automatically split between you and UniCloud",
    icon: CreditCard,
    color: "orange",
  },
  trust_invoice: {
    label: "Monthly Invoice",
    description: "Services provisioned first, invoiced monthly",
    icon: Clock,
    color: "yellow",
  },
};

const formatCurrency = (cents: number, currency = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
};

const TenantBillingSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [gatewayForm, setGatewayForm] = useState({
    provider: "paystack",
    public_key: "",
    secret_key: "",
    subaccount_code: "",
    is_test_mode: true,
  });

  const { data: config, isLoading: isLoadingConfig } = useTenantBillingConfig();
  const { data: balanceData, isLoading: isLoadingBalance } = useTenantBillingBalance();
  const { data: gatewayData, isLoading: isLoadingGateways } = useTenantPaymentGateways();

  const selectModelMutation = useSelectBillingModel();
  const saveGatewayMutation = useSavePaymentGateway();
  const deleteGatewayMutation = useDeletePaymentGateway();

  const handleSelectModel = (model: string) => {
    if (config?.billing_model === model) return;
    selectModelMutation.mutate(model);
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveGatewayMutation.mutateAsync(gatewayForm);
    setIsGatewayModalOpen(false);
    setGatewayForm({
      provider: "paystack",
      public_key: "",
      secret_key: "",
      subaccount_code: "",
      is_test_mode: true,
    });
  };

  const handleDeleteGateway = (id: number) => {
    if (confirm("Are you sure you want to remove this payment gateway?")) {
      deleteGatewayMutation.mutate(id);
    }
  };

  return (
    <TenantPageShell
      title="Billing Settings"
      description="Manage your billing model and payment configuration"
    >
      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Wallet Balance</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {isLoadingBalance ? "..." : formatCurrency(balanceData?.wallet_balance_cents || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outstanding Balance</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {isLoadingBalance
                  ? "..."
                  : formatCurrency(balanceData?.total_outstanding_cents || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Model</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {isLoadingConfig
                  ? "..."
                  : BILLING_MODEL_INFO[config?.billing_model || "direct"]?.label}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Billing Model Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Model</h2>
        {config?.can_change_billing_model ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(config?.allowed_billing_models || []).map((model) => {
              const info = BILLING_MODEL_INFO[model];
              if (!info) return null;
              const Icon = info.icon;
              const isSelected = config?.billing_model === model;

              return (
                <button
                  key={model}
                  onClick={() => handleSelectModel(model)}
                  disabled={selectModelMutation.isPending}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? `border-${info.color}-500 bg-${info.color}-50`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? `bg-${info.color}-500 text-white` : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{info.label}</h3>
                        {isSelected && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
            <p>
              Your billing model is set to{" "}
              <strong>{BILLING_MODEL_INFO[config?.billing_model || "direct"]?.label}</strong>.
            </p>
            <p className="text-sm mt-1">Contact your administrator to change your billing model.</p>
          </div>
        )}
      </div>

      {/* Payment Gateways (if allowed) */}
      {config?.allow_client_gateway && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Payment Gateways</h2>
            <button
              onClick={() => setIsGatewayModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Gateway
            </button>
          </div>

          {isLoadingGateways ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-gray-200 rounded" />
            </div>
          ) : gatewayData?.gateways?.length > 0 ? (
            <div className="space-y-3">
              {gatewayData.gateways.map((gateway) => (
                <div
                  key={gateway.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border">
                      <Key className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{gateway.provider}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {gateway.is_ready ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Incomplete
                          </span>
                        )}
                        {gateway.is_test_mode && (
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                            Test Mode
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGateway(gateway.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No payment gateways configured</p>
              <p className="text-sm mt-1">Add your Paystack or Stripe keys to accept payments</p>
            </div>
          )}
        </div>
      )}

      {/* Outstanding Settlements */}
      {balanceData?.settlements?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Settlements</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {balanceData.settlements.map((settlement) => (
                  <tr key={settlement.id} className="text-sm">
                    <td className="py-3 text-gray-900">
                      {settlement.description || "Service charge"}
                    </td>
                    <td className="py-3 font-medium text-gray-900">
                      {settlement.amount_formatted}
                    </td>
                    <td className="py-3 text-gray-600">
                      {new Date(settlement.due_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Gateway Modal */}
      {isGatewayModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add Payment Gateway</h3>
              <button
                onClick={() => setIsGatewayModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveGateway} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select
                  value={gatewayForm.provider}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="paystack">Paystack</option>
                  <option value="stripe">Stripe</option>
                  <option value="flutterwave">Flutterwave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                <input
                  type="text"
                  value={gatewayForm.public_key}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, public_key: e.target.value })}
                  placeholder="pk_live_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <div className="relative">
                  <input
                    type={showSecretKey ? "text" : "password"}
                    value={gatewayForm.secret_key}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, secret_key: e.target.value })}
                    placeholder="sk_live_..."
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500"
                  >
                    {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {config?.billing_model === "paystack_split" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subaccount Code (for split payments)
                  </label>
                  <input
                    type="text"
                    value={gatewayForm.subaccount_code}
                    onChange={(e) =>
                      setGatewayForm({ ...gatewayForm, subaccount_code: e.target.value })
                    }
                    placeholder="ACCT_..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="test_mode"
                  checked={gatewayForm.is_test_mode}
                  onChange={(e) =>
                    setGatewayForm({ ...gatewayForm, is_test_mode: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="test_mode" className="text-sm text-gray-700">
                  Test Mode (use test keys)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsGatewayModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveGatewayMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveGatewayMutation.isPending ? "Saving..." : "Save Gateway"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TenantPageShell>
  );
};

export default TenantBillingSettings;
