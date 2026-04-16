import { useState } from "react";
import { Plus, Shield } from "lucide-react";
import useCartStore from "@/stores/cartStore";

const PROVIDERS = [
  { id: "provider_a", name: "Provider A (Enterprise)", features: ["L3/L4 DDoS", "WAF", "Bot Protection", "Rate Limiting"] },
  { id: "provider_b", name: "Provider B (CDN + Security)", features: ["CDN", "L7 DDoS", "WAF Rules", "SSL Management", "Analytics"] },
];

const PROTECTION_MODES = [
  { id: "standard", label: "Standard", desc: "Basic DDoS + WAF protection", price: 5000 },
  { id: "enhanced", label: "Enhanced", desc: "Advanced WAF rules + bot protection", price: 15000 },
  { id: "enterprise", label: "Enterprise", desc: "Full protection + dedicated support", price: 50000 },
];

const SSL_TYPES = [
  { id: "lets_encrypt", label: "Auto-Managed (Let's Encrypt)", price: 0 },
  { id: "custom", label: "Custom Certificate", price: 0 },
  { id: "dedicated", label: "Dedicated SSL", price: 2000 },
];

export default function ShieldConfigurator() {
  const addItem = useCartStore((s) => s.addItem);
  const [provider, setProvider] = useState("provider_a");
  const [mode, setMode] = useState("standard");
  const [ssl, setSsl] = useState("lets_encrypt");
  const [domains, setDomains] = useState(1);
  const [months, setMonths] = useState(1);

  const selectedMode = PROTECTION_MODES.find((m) => m.id === mode);
  const selectedSsl = SSL_TYPES.find((s) => s.id === ssl);
  const selectedProvider = PROVIDERS.find((p) => p.id === provider);
  const modePrice = (selectedMode?.price ?? 0) * domains;
  const sslPrice = (selectedSsl?.price ?? 0) * domains;
  const totalMonthly = modePrice + sslPrice;

  const fmt = (v: number) => `₦${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50"><Shield className="h-5 w-5 text-red-600" /></div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configure Shield Protection</h3>
          <p className="text-xs text-gray-500">Web Application Firewall, DDoS mitigation, and SSL management</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Security Provider</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROVIDERS.map((p) => (
            <button key={p.id} onClick={() => setProvider(p.id)} className={`rounded-lg border-2 p-4 text-left transition-all ${provider === p.id ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}>
              <div className="text-sm font-bold text-gray-900">{p.name}</div>
              <div className="mt-2 flex flex-wrap gap-1">{p.features.map((f) => <span key={f} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">{f}</span>)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Protection Level</h4>
        <div className="grid gap-2 sm:grid-cols-3">
          {PROTECTION_MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`rounded-lg border-2 p-3 text-left transition-all ${mode === m.id ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}>
              <div className="text-sm font-bold text-gray-900">{m.label}</div>
              <div className="text-[11px] text-gray-500">{m.desc}</div>
              <div className="mt-1 text-sm font-semibold text-red-700">{fmt(m.price)}/domain/mo</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">SSL Certificate</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          {SSL_TYPES.map((s) => (
            <label key={s.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-xs ${ssl === s.id ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
              <input type="radio" name="ssl" checked={ssl === s.id} onChange={() => setSsl(s.id)} className="text-red-600" />
              <div>
                <div className="font-medium text-gray-900">{s.label}</div>
                <div className="text-gray-500">{s.price === 0 ? "Free" : `${fmt(s.price)}/domain/mo`}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs font-medium text-gray-600">Number of Domains</label><input type="number" value={domains} onChange={(e) => setDomains(Math.max(1, +e.target.value))} min={1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-xs font-medium text-gray-600">Duration</label><select value={months} onChange={(e) => setMonths(+e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">{[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} {m === 1 ? "month" : "months"}</option>)}</select></div>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-red-50 to-orange-50 p-5">
        <div className="mb-3 text-sm font-semibold text-gray-700">Cost Breakdown</div>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between"><span>{selectedMode?.label} protection × {domains} domains</span><span>{fmt(modePrice)}/mo</span></div>
          {sslPrice > 0 && <div className="flex justify-between"><span>SSL ({selectedSsl?.label}) × {domains}</span><span>{fmt(sslPrice)}/mo</span></div>}
          <div className="flex justify-between border-t border-red-200 pt-1 font-semibold text-gray-800"><span>Total</span><span>{fmt(totalMonthly)}/mo</span></div>
        </div>
        <button onClick={() => addItem({ category: "shield", name: `Shield ${selectedMode?.label} × ${domains} domains`, description: `${selectedProvider?.name}, ${selectedSsl?.label} SSL`, config: { provider, mode, ssl, domains, months }, monthly_cost: totalMonthly, one_time_cost: 0, quantity: 1, currency: "NGN" })} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
          <Plus className="h-4 w-4" />Add to Cart
        </button>
      </div>
    </div>
  );
}
