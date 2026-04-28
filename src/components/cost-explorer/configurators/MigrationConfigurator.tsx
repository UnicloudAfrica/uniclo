import { useState } from "react";
import { Plus, ArrowLeftRight } from "lucide-react";
import useCartStore from "@/stores/cartStore";
import { useFetchAcfPublicServices, type AcfService } from "@/hooks/useCostExplorer";

export default function MigrationConfigurator() {
  const { data: services, isLoading } = useFetchAcfPublicServices();
  const addItem = useCartStore((s) => s.addItem);
  const [selected, setSelected] = useState<Record<string, { qty: number; months: number }>>({});

  const svcList = Array.isArray(services) ? services : [];
  const fmt = (v: number) => `₦${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const toggle = (type: string) => {
    if (selected[type]) {
      const next = { ...selected };
      delete next[type];
      setSelected(next);
    } else {
      setSelected({ ...selected, [type]: { qty: 1, months: 1 } });
    }
  };

  const update = (type: string, field: string, value: number) => {
    setSelected({ ...selected, [type]: { ...selected[type], [field]: value } });
  };

  // Resolve price applying tiered discounts if available
  const resolvePrice = (svc: AcfService, qty: number): { price: number; tierLabel: string | null } => {
    if (svc.pricing_tiers && svc.pricing_tiers.length > 0) {
      for (const tier of svc.pricing_tiers) {
        const max = tier.max_units ?? Infinity;
        if (qty >= tier.min_units && qty <= max) {
          return { price: tier.price_usd, tierLabel: tier.label };
        }
      }
    }
    return { price: svc.unit_price, tierLabel: null };
  };

  const calcLineTotal = (svc: AcfService, cfg: { qty: number; months: number }) => {
    const { price } = resolvePrice(svc, cfg.qty);
    if (svc.billing_model === "monthly_flat") return price * cfg.qty * cfg.months;
    // one_time — flat per-VM/per-database fee
    return price * cfg.qty;
  };

  const totalMonthly = Object.entries(selected).reduce((sum, [type, cfg]) => {
    const svc = svcList.find((s) => s.service_type === type);
    return svc ? sum + calcLineTotal(svc, cfg) : sum;
  }, 0);

  if (isLoading) return <p className="text-gray-400">Loading services...</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50"><ArrowLeftRight className="h-5 w-5 text-indigo-600" /></div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configure Migration & DR Services</h3>
          <p className="text-xs text-gray-500">Flat per-VM pricing — migration, replication, database migration, backup orchestration</p>
        </div>
      </div>

      <div className="space-y-2">
        {svcList.map((svc) => {
          const isSelected = !!selected[svc.service_type];
          const cfg = selected[svc.service_type];
          return (
            <div key={svc.service_type} className={`rounded-lg border-2 p-4 transition-all ${isSelected ? "border-indigo-300 bg-indigo-50/50" : "border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={isSelected} onChange={() => toggle(svc.service_type)} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{svc.name}</div>
                    <div className="text-[11px] text-gray-500">
                      {svc.description} — {fmt(svc.unit_price)} {svc.unit_label}
                      {svc.pricing_tiers && svc.pricing_tiers.length > 0 && (
                        <span className="ml-1 rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-600">Volume discounts available</span>
                      )}
                    </div>
                  </div>
                </label>
                {isSelected && (
                  <div className="text-right">
                    <span className="text-sm font-bold text-indigo-700">{fmt(calcLineTotal(svc, cfg))}</span>
                    {(() => { const { tierLabel } = resolvePrice(svc, cfg.qty); return tierLabel ? <div className="text-[9px] text-indigo-500">{tierLabel}</div> : null; })()}
                  </div>
                )}
              </div>
              {isSelected && (
                <div className="mt-3 space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div><label className="text-[10px] text-gray-500">{svc.is_one_time ? "VMs / Databases" : "VMs"}</label><input type="number" value={cfg.qty} onChange={(e) => update(svc.service_type, "qty", Math.max(1, +e.target.value))} min={1} className="w-full rounded border px-2 py-1 text-xs" /></div>
                    {svc.is_recurring && (
                      <div><label className="text-[10px] text-gray-500">Months</label><input type="number" value={cfg.months} onChange={(e) => update(svc.service_type, "months", Math.max(1, +e.target.value))} min={1} className="w-full rounded border px-2 py-1 text-xs" /></div>
                    )}
                  </div>
                  {/* Show tier pricing table if available */}
                  {svc.pricing_tiers && svc.pricing_tiers.length > 0 && (
                    <div className="rounded-lg bg-indigo-50/50 p-2">
                      <p className="mb-1.5 text-[10px] font-semibold text-indigo-700">Volume Discount Tiers</p>
                      <div className="grid gap-1 grid-cols-2 sm:grid-cols-4">
                        {svc.pricing_tiers.map((tier) => {
                          const { tierLabel } = resolvePrice(svc, cfg.qty);
                          const isActive = tierLabel === tier.label;
                          return (
                            <div key={tier.label} className={`rounded border p-1.5 text-center text-[10px] ${isActive ? "border-indigo-400 bg-indigo-100 font-bold text-indigo-800" : "border-indigo-200 bg-white text-gray-600"}`}>
                              <div>{tier.label}</div>
                              <div className="font-semibold">{fmt(tier.price_usd)}/unit</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {Object.keys(selected).length > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">{Object.keys(selected).length} service{Object.keys(selected).length > 1 ? "s" : ""} selected</span>
            <span className="text-xl font-bold text-indigo-700">{fmt(totalMonthly)}</span>
          </div>
          <button onClick={() => {
            Object.entries(selected).forEach(([type, cfg]) => {
              const svc = svcList.find((s) => s.service_type === type);
              if (svc) addItem({ category: "migration", name: svc.name, description: `${cfg.qty} ${svc.is_one_time ? "unit" : "VM"}${cfg.qty > 1 ? "s" : ""}${svc.is_recurring ? ` × ${cfg.months}mo` : ""}`, config: { service_type: type, ...cfg }, monthly_cost: svc.is_recurring ? calcLineTotal(svc, { qty: cfg.qty, months: 1 }) : 0, one_time_cost: svc.is_one_time ? calcLineTotal(svc, cfg) : 0, quantity: 1, currency: "NGN" });
            });
          }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" />Add All to Cart
          </button>
        </div>
      )}
    </div>
  );
}
