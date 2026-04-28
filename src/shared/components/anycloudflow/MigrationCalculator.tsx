import { useState } from "react";
import { Calculator, Plus, Trash2, ChevronDown, ChevronUp, Zap, CheckCircle, ArrowUpCircle } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import {
  useFetchAcfServices,
  useCalculateMigration,
  useFetchAcfQuotas,
  useUpgradeAcfQuota,
  type AcfService,
  type CalculatorItem,
  type CalculatorResult,
  type QuotaStatus,
} from "@/hooks/anyCloudFlowCalculatorHooks";

interface MigrationCalculatorProps {
  context: "admin" | "tenant" | "client";
}

const MigrationCalculator = ({ _context }: MigrationCalculatorProps) => {
  const { data: services, isLoading: servicesLoading } = useFetchAcfServices();
  const { data: quotas } = useFetchAcfQuotas();
  const calculateMutation = useCalculateMigration();
  const upgradeMutation = useUpgradeAcfQuota();

  const [items, setItems] = useState<(CalculatorItem & { enabled: boolean })[]>([]);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [showQuotas, setShowQuotas] = useState(false);

  const serviceList = Array.isArray(services) ? services : [];
  const quotaMap = (quotas ?? {}) as QuotaStatus;

  const addService = (svc: AcfService) => {
    if (items.find((i) => i.service_type === svc.service_type)) return;
    setItems([...items, {
      service_type: svc.service_type,
      quantity: svc.is_one_time || svc.is_recurring ? 1 : undefined,
      data_gb: undefined,
      months: svc.is_recurring ? 1 : undefined,
      enabled: true,
    }]);
  };

  const updateItem = (idx: number, field: string, value: number) => {
    const updated = [...items];
    (updated[idx] as unknown as Record<string, unknown>)[field] = value;
    setItems(updated);
    setResult(null);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
    setResult(null);
  };

  const handleCalculate = () => {
    const enabledItems = items.filter((i) => i.enabled).map(({ _enabled, ...rest }) => rest);
    if (enabledItems.length === 0) return;
    calculateMutation.mutate({ items: enabledItems }, { onSuccess: (data) => setResult(data) });
  };

  const _getServiceName = (type: string) => serviceList.find((s) => s.service_type === type)?.name ?? type;
  const getService = (type: string) => serviceList.find((s) => s.service_type === type);

  if (servicesLoading) return <div className="flex justify-center p-12 text-gray-400">Loading services...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl px-8 py-6" style={{ background: `linear-gradient(135deg, ${designTokens.colors.neutral[900]} 0%, #1e40af 50%, ${designTokens.colors.neutral[800]} 100%)` }}>
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Calculator className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Migration Cost Calculator</h2>
            <p className="text-sm text-gray-300">Estimate costs for migration, replication, backup, and DR services</p>
          </div>
        </div>
      </div>

      {/* Service Selection */}
      <div className="rounded-xl border bg-white p-6" style={{ borderColor: designTokens.colors.neutral[200] }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: designTokens.colors.neutral[900] }}>Select Services</h3>
          <button onClick={() => setShowQuotas(!showQuotas)} className="flex items-center gap-1 text-xs font-medium" style={{ color: designTokens.colors.primary[600] }}>
            {showQuotas ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showQuotas ? "Hide Quotas" : "Show Quotas"}
          </button>
        </div>

        {/* Available Services */}
        <div className="mb-4 flex flex-wrap gap-2">
          {serviceList.map((svc) => {
            const added = items.some((i) => i.service_type === svc.service_type);
            return (
              <button
                key={svc.service_type}
                onClick={() => !added && addService(svc)}
                disabled={added}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all disabled:opacity-40"
                style={{
                  borderColor: added ? designTokens.colors.success[300] : designTokens.colors.neutral[300],
                  backgroundColor: added ? designTokens.colors.success[50] : "#fff",
                  color: added ? designTokens.colors.success[700] : designTokens.colors.neutral[700],
                }}
              >
                {added ? <CheckCircle className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                {svc.name}
                <span className="text-[10px] opacity-60">${svc.unit_price}/{svc.unit_label?.split("/").pop()}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Items with Config */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const svc = getService(item.service_type);
              if (!svc) return null;
              return (
                <div key={item.service_type} className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: designTokens.colors.neutral[50] }}>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: designTokens.colors.neutral[900] }}>{svc.name}</p>
                    <p className="text-[11px]" style={{ color: designTokens.colors.neutral[400] }}>{svc.billing_model} — ${svc.unit_price} {svc.unit_label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(svc.is_one_time || svc.is_recurring) && (
                      <div className="text-center">
                        <label className="block text-[10px]" style={{ color: designTokens.colors.neutral[500] }}>Qty</label>
                        <input type="number" min={1} value={item.quantity ?? 1} onChange={(e) => updateItem(idx, "quantity", +e.target.value)} className="w-16 rounded border px-2 py-1 text-center text-xs" style={{ borderColor: designTokens.colors.neutral[300] }} />
                      </div>
                    )}
                    {svc.is_recurring && (
                      <div className="text-center">
                        <label className="block text-[10px]" style={{ color: designTokens.colors.neutral[500] }}>Months</label>
                        <input type="number" min={1} value={item.months ?? 1} onChange={(e) => updateItem(idx, "months", +e.target.value)} className="w-16 rounded border px-2 py-1 text-center text-xs" style={{ borderColor: designTokens.colors.neutral[300] }} />
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeItem(idx)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              );
            })}
          </div>
        )}

        {/* Calculate Button */}
        <div className="mt-4">
          <button
            onClick={handleCalculate}
            disabled={items.filter((i) => i.enabled).length === 0 || calculateMutation.isPending}
            className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: designTokens.colors.primary[600] }}
          >
            <Calculator className="h-4 w-4" />
            {calculateMutation.isPending ? "Calculating..." : "Calculate Cost"}
          </button>
        </div>
      </div>

      {/* Quota Status */}
      {showQuotas && Object.keys(quotaMap).length > 0 && (
        <div className="rounded-xl border bg-white p-6" style={{ borderColor: designTokens.colors.neutral[200] }}>
          <h3 className="mb-4 text-base font-semibold" style={{ color: designTokens.colors.neutral[900] }}>Service Quotas</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(quotaMap).map(([serviceType, quota]) => {
              const isFull = quota.available === 0 && quota.limit > 0;
              const isUnlimited = quota.limit === -1;
              return (
                <div key={serviceType} className="rounded-lg border p-3" style={{ borderColor: isFull ? designTokens.colors.error[200] : designTokens.colors.neutral[200], backgroundColor: isFull ? designTokens.colors.error[50] : "#fff" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium capitalize" style={{ color: designTokens.colors.neutral[700] }}>{serviceType.replace(/_/g, " ")}</p>
                    {quota.fast_tracked && <Zap className="h-3 w-3" style={{ color: designTokens.colors.warning[500] }} aria-label="Fast tracked" />}
                  </div>
                  <p className="mt-1 text-lg font-bold" style={{ color: isFull ? designTokens.colors.error[600] : designTokens.colors.neutral[900] }}>
                    {isUnlimited ? "Unlimited" : `${quota.used} / ${quota.limit}`}
                  </p>
                  {!isUnlimited && quota.limit > 0 && (
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: designTokens.colors.neutral[100] }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, quota.percentage_used)}%`, backgroundColor: isFull ? designTokens.colors.error[500] : quota.percentage_used > 75 ? designTokens.colors.warning[500] : designTokens.colors.success[500] }} />
                    </div>
                  )}
                  {isFull && (
                    <button
                      onClick={() => upgradeMutation.mutate({ serviceType, newLimit: quota.limit * 2 })}
                      disabled={upgradeMutation.isPending}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded py-1 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: designTokens.colors.primary[600] }}
                    >
                      <ArrowUpCircle className="h-3 w-3" />Upgrade to {quota.limit * 2}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-xl border bg-white p-6" style={{ borderColor: designTokens.colors.neutral[200] }}>
          <h3 className="mb-4 text-base font-semibold" style={{ color: designTokens.colors.neutral[900] }}>Cost Breakdown</h3>

          {/* Line Items */}
          <div className="overflow-hidden rounded-lg border" style={{ borderColor: designTokens.colors.neutral[200] }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium" style={{ color: designTokens.colors.neutral[500] }}>
                  <th className="px-4 py-2">Service</th>
                  <th className="px-4 py-2">Details</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {result.lines.map((line, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium" style={{ color: designTokens.colors.neutral[900] }}>{line.name}</td>
                    <td className="px-4 py-2 text-xs" style={{ color: designTokens.colors.neutral[500] }}>
                      {line.breakdown}
                      {line.tier_applied && <span className="ml-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">{line.tier_applied}</span>}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${line.frequency === "recurring" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                        {line.frequency === "recurring" ? "Monthly" : "One-time"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
                      {result.summary.currency} {line.line_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 space-y-2 rounded-lg p-4" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: designTokens.colors.neutral[600] }}>One-time costs</span>
              <span className="font-medium">{result.summary.currency} {result.summary.one_time_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: designTokens.colors.neutral[600] }}>Monthly recurring</span>
              <span className="font-medium">{result.summary.currency} {result.summary.monthly_recurring.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: designTokens.colors.neutral[600] }}>Subtotal for period</span>
              <span className="font-medium">{result.summary.currency} {result.summary.total_for_period.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {result.summary.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: designTokens.colors.neutral[600] }}>Tax ({result.summary.vat_rate}%)</span>
                <span>{result.summary.currency} {result.summary.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold" style={{ borderColor: designTokens.colors.neutral[200], color: designTokens.colors.neutral[900] }}>
              <span>Grand Total</span>
              <span style={{ color: designTokens.colors.primary[700] }}>{result.summary.currency} {result.summary.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrationCalculator;
