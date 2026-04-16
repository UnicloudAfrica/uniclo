import { useState } from "react";
import { Plus, Activity, CheckCircle } from "lucide-react";
import useCartStore from "@/stores/cartStore";

const TIERS = [
  { id: "basic", label: "Basic", price: 0, retention: "24 hours", features: ["CPU/RAM/Disk/Network metrics", "3 default alert rules", "In-app notifications"], color: "gray" },
  { id: "standard", label: "Standard", price: 2000, retention: "30 days", features: ["Everything in Basic", "Unlimited alert rules", "Email notifications", "Custom thresholds"], color: "blue" },
  { id: "professional", label: "Professional", price: 5000, retention: "90 days", features: ["Everything in Standard", "Log aggregation", "Uptime monitoring", "Custom dashboards", "Webhook notifications"], color: "purple" },
  { id: "enterprise", label: "Enterprise", price: 10000, retention: "1 year", features: ["Everything in Professional", "SNMP network monitoring", "Network topology maps", "Raw Prometheus access", "API access", "SLA reports"], color: "amber" },
];

export default function MonitoringConfigurator() {
  const addItem = useCartStore((s) => s.addItem);
  const [tier, setTier] = useState("standard");
  const [vmCount, setVmCount] = useState(5);
  const [months, setMonths] = useState(1);

  const selected = TIERS.find((t) => t.id === tier);
  const totalMonthly = (selected?.price ?? 0) * vmCount;
  const fmt = (v: number) => `₦${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50"><Activity className="h-5 w-5 text-teal-600" /></div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configure Infrastructure Monitoring</h3>
          <p className="text-xs text-gray-500">Real-time metrics, alerts, logs, and network monitoring powered by CuberWatch</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Select Tier</h4>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {TIERS.map((t) => (
            <button key={t.id} onClick={() => setTier(t.id)} className={`min-w-0 overflow-hidden rounded-xl border-2 p-4 text-left transition-all ${tier === t.id ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-gray-300"}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-gray-900">{t.label}</div>
                <div className="text-sm font-bold text-teal-700">{t.price === 0 ? "Free" : `${fmt(t.price)}/VM/mo`}</div>
              </div>
              <div className="mt-1 text-[10px] text-gray-500">Retention: {t.retention}</div>
              <ul className="mt-2 space-y-0.5">
                {t.features.map((f) => <li key={f} className="flex items-start gap-1 text-[10px] text-gray-600"><CheckCircle className="mt-0.5 h-2.5 w-2.5 shrink-0 text-teal-500" /><span className="break-words">{f}</span></li>)}
              </ul>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs font-medium text-gray-600">VMs to Monitor</label><input type="number" value={vmCount} onChange={(e) => setVmCount(Math.max(1, +e.target.value))} min={1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600">Duration</label><select value={months} onChange={(e) => setMonths(+e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">{[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} {m === 1 ? "month" : "months"}</option>)}</select></div>
        </div>
      </div>

      {selected && selected.price > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-800">{selected.label} × {vmCount} VMs</span>
              <p className="text-xs text-gray-500">{selected.retention} retention</p>
            </div>
            <span className="text-xl font-bold text-teal-700">{fmt(totalMonthly)}/mo</span>
          </div>
          <button onClick={() => addItem({ category: "monitoring", name: `Monitoring ${selected.label} × ${vmCount} VMs`, description: `${selected.retention} retention, ${selected.features.length} features`, config: { tier, vm_count: vmCount, months }, monthly_cost: totalMonthly, one_time_cost: 0, quantity: 1, currency: "NGN" })} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
            <Plus className="h-4 w-4" />Add to Cart
          </button>
        </div>
      )}
      {selected?.price === 0 && <p className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">Basic monitoring is free and included with every VM. Upgrade for extended retention and features.</p>}
    </div>
  );
}
