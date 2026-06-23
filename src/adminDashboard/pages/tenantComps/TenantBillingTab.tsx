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
  Key,
  Loader2,
} from "lucide-react";
import { ModernButton, ModernInput, ModernSelect } from "@/shared/components/ui";
import {
  useAdminTenantBillingConfig,
  useAdminTenantBillingSummary,
  useUpdateTenantBillingConfig,
  useAddTenantCredit,
} from "@/hooks/useAdminTenantBilling";

const accent = "var(--theme-color)";

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

const SectionCard = ({
  icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div className="mb-4 flex items-start gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "var(--theme-color-10)", color: accent }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 break-words text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {children}
  </div>
);

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
  const { data: summary, isLoading: _isLoadingSummary } = useAdminTenantBillingSummary(tenantId);
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
        allowed_billing_models: current.filter((m: unknown) => m !== model),
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
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: accent }} />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          Loading billing configuration...
        </span>
      </div>
    );
  }

  const summaryTiles = [
    {
      label: "Wallet Balance",
      value: formatCurrency(summary?.wallet_balance_cents || 0),
      icon: <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      valueClass: "text-green-600 dark:text-green-400",
    },
    {
      label: "Credit Limit",
      value: formatCurrency(summary?.credit_limit_cents || 0),
      icon: <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      valueClass: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Outstanding",
      value: formatCurrency(summary?.total_outstanding_cents || 0),
      icon: (
        <AlertTriangle
          className={`h-5 w-5 ${
            summary?.is_overdue
              ? "text-red-600 dark:text-red-400"
              : "text-yellow-600 dark:text-yellow-400"
          }`}
        />
      ),
      iconBg: summary?.is_overdue
        ? "bg-red-100 dark:bg-red-900/30"
        : "bg-yellow-100 dark:bg-yellow-900/30",
      valueClass: summary?.is_overdue
        ? "text-red-600 dark:text-red-400"
        : "text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Billing Model",
      value: (config?.billing_model || "direct").replace(/_/g, " "),
      icon: <Settings className="h-5 w-5" style={{ color: accent }} />,
      iconBg: "",
      iconBgStyle: { background: "var(--theme-color-10)" },
      valueClass: "capitalize",
      valueStyle: { color: accent },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryTiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tile.iconBg}`}
                style={tile.iconBgStyle}
              >
                {tile.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {tile.label}
                </p>
                <p
                  className={`break-words text-lg font-semibold ${tile.valueClass}`}
                  style={tile.valueStyle}
                >
                  {tile.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <ModernButton
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowAddCredit(true)}
        >
          <Plus className="h-4 w-4" />
          Add Credit
        </ModernButton>
        <ModernButton
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Settings className="h-4 w-4" />
          {isEditing ? "Cancel Editing" : "Edit Configuration"}
        </ModernButton>
      </div>

      {/* Add Credit Modal */}
      {showAddCredit && (
        <SectionCard icon={<Plus size={16} />} title="Add Prepaid Credit">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Amount (NGN)
              </label>
              <ModernInput
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="1000.00"
                className="w-full max-w-full"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Description (optional)
              </label>
              <ModernInput
                type="text"
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
                placeholder="Manual top-up"
                className="w-full max-w-full"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <ModernButton
              variant="primary"
              size="sm"
              onClick={handleAddCredit}
              disabled={addCreditMutation.isPending}
            >
              {addCreditMutation.isPending ? "Adding..." : "Add Credit"}
            </ModernButton>
            <ModernButton variant="outline" size="sm" onClick={() => setShowAddCredit(false)}>
              Cancel
            </ModernButton>
          </div>
        </SectionCard>
      )}

      {/* Configuration Form */}
      {isEditing ? (
        <SectionCard icon={<Settings size={16} />} title="Billing Configuration">
          <div className="space-y-6">
            {/* Allowed Billing Models */}
            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Allowed Billing Models
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {BILLING_MODELS.map(
                  ({
                    value,
                    label,
                    icon: Icon,
                  }: {
                    value: string;
                    label: string;
                    icon: React.ComponentType<{ size?: number; className?: string }>;
                  }) => {
                    const selected = formData.allowed_billing_models?.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleAllowedModel(value)}
                        className={`flex min-w-0 items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                          selected
                            ? "bg-white dark:bg-gray-800"
                            : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                        }`}
                        style={
                          selected
                            ? { borderColor: accent, background: "var(--theme-color-10)" }
                            : undefined
                        }
                      >
                        <Icon className="h-5 w-5 shrink-0 text-gray-600 dark:text-gray-300" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                          {label}
                        </span>
                        {selected && (
                          <CheckCircle className="ml-auto h-4 w-4 shrink-0" style={{ color: accent }} />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Current Billing Model */}
            <div className="min-w-0">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Current Billing Model
              </label>
              <ModernSelect
                value={formData.billing_model}
                onChange={(e) => setFormData({ ...formData, billing_model: e.target.value })}
                className="w-full max-w-full"
                options={BILLING_MODELS.filter((m) =>
                  formData.allowed_billing_models?.includes(m.value)
                ).map(({ value, label }) => ({ value, label }))}
              />
            </div>

            {/* Credit Limit + Margin */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Credit Limit (NGN)
                </label>
                <ModernInput
                  type="number"
                  value={formData.credit_limit_cents / 100}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credit_limit_cents: Math.round(parseFloat(e.target.value || "0") * 100),
                    })
                  }
                  className="w-full max-w-full"
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Margin Percent (%)
                </label>
                <ModernInput
                  type="number"
                  value={formData.margin_percent}
                  onChange={(e) =>
                    setFormData({ ...formData, margin_percent: parseFloat(e.target.value || "0") })
                  }
                  className="w-full max-w-full"
                />
              </div>
            </div>

            {/* Payment Terms */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Payment Terms (days)
                </label>
                <ModernInput
                  type="number"
                  value={formData.payment_terms_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_terms_days: parseInt(e.target.value || "30"),
                    })
                  }
                  className="w-full max-w-full"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                <input
                  type="checkbox"
                  checked={formData.auto_suspend_on_overdue}
                  onChange={(e) =>
                    setFormData({ ...formData, auto_suspend_on_overdue: e.target.checked })
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 dark:border-gray-600"
                  style={{ accentColor: accent }}
                />
                <span className="min-w-0 flex-1 break-words text-sm text-gray-900 dark:text-white">
                  Auto-suspend services when overdue
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                <input
                  type="checkbox"
                  checked={formData.allow_client_gateway}
                  onChange={(e) =>
                    setFormData({ ...formData, allow_client_gateway: e.target.checked })
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 dark:border-gray-600"
                  style={{ accentColor: accent }}
                />
                <span className="min-w-0 flex-1 break-words text-sm text-gray-900 dark:text-white">
                  Allow tenant to configure their own payment gateway
                </span>
              </label>
            </div>

            {/* Save Button */}
            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
              <ModernButton variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
              </ModernButton>
            </div>
          </div>
        </SectionCard>
      ) : (
        /* Read-only Config Display */
        <SectionCard icon={<Settings size={16} />} title="Current Configuration">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Billing Model
              </dt>
              <dd className="mt-0.5 break-words text-sm capitalize text-gray-900 dark:text-white">
                {(config?.billing_model || "direct").replace(/_/g, " ")}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Credit Limit
              </dt>
              <dd className="mt-0.5 break-all text-sm text-gray-900 dark:text-white">
                {formatCurrency(config?.credit_limit_cents || 0)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Margin
              </dt>
              <dd className="mt-0.5 break-all text-sm text-gray-900 dark:text-white">
                {config?.margin_percent || 0}%
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Payment Terms
              </dt>
              <dd className="mt-0.5 break-all text-sm text-gray-900 dark:text-white">
                {config?.payment_terms_days || 30} days
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Auto-Suspend
              </dt>
              <dd className="mt-0.5 break-words text-sm text-gray-900 dark:text-white">
                {config?.auto_suspend_on_overdue ? "Yes" : "No"}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Client Gateway
              </dt>
              <dd className="mt-0.5 break-words text-sm text-gray-900 dark:text-white">
                {config?.allow_client_gateway ? "Allowed" : "Not Allowed"}
              </dd>
            </div>
          </dl>

          {config?.allowed_billing_models?.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Allowed Models
              </p>
              <div className="flex flex-wrap gap-2">
                {config?.allowed_billing_models.map((model) => (
                  <span
                    key={model}
                    className="shrink-0 break-all rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {model.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {config?.payment_gateways?.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Configured Gateways
              </p>
              <div className="flex flex-wrap gap-2">
                {config?.payment_gateways.map((gw) => (
                  <span
                    key={gw.id}
                    className={`inline-flex shrink-0 items-center gap-1 break-all rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      gw.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Key className="h-3 w-3 shrink-0" />
                    {gw.provider}
                    {gw.is_test_mode && " (test)"}
                  </span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
